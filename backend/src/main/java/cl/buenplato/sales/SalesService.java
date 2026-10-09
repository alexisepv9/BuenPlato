/**
 * Núcleo transaccional de ventas.
 * Valida la composición buffet, calcula precios, conserva snapshots y descuenta
 * inventario de forma atómica para evitar pedidos parcialmente registrados.
 */
package cl.buenplato.sales;

import cl.buenplato.sales.SalesDtos.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.PreparedStatement;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class SalesService {
    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SalesService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public SalesCatalogResponse catalog() {
        List<MenuResponse> menus = jdbc.query("""
                SELECT id, name, description, base_price
                FROM menus
                WHERE active = TRUE
                  AND (available_from IS NULL OR available_from <= CURRENT_DATE)
                  AND (available_to IS NULL OR available_to >= CURRENT_DATE)
                ORDER BY id
                """, (rs, rowNum) -> {
            long menuId = rs.getLong("id");
            return new MenuResponse(
                    menuId,
                    rs.getString("name"),
                    rs.getString("description"),
                    rs.getInt("base_price"),
                    sections(menuId)
            );
        });

        List<ProductSaleResponse> additionalProducts = jdbc.query("""
                SELECT p.id, p.name, p.description, p.price, p.stock, c.name category, c.slug
                FROM products p
                JOIN categories c ON c.id = p.category_id
                WHERE p.active = TRUE
                  AND c.active = TRUE
                ORDER BY c.display_order, p.name
                """, (rs, rowNum) -> new ProductSaleResponse(
                rs.getLong("id"),
                rs.getString("name"),
                rs.getString("description"),
                rs.getInt("price"),
                rs.getString("category"),
                rs.getString("slug"),
                rs.getDouble("stock")
        ));
        return new SalesCatalogResponse(menus, additionalProducts);
    }

    @Transactional(readOnly = true)
    public List<OrderHistoryResponse> orderHistory() {
        return jdbc.query("""
                SELECT id, order_number, customer_name, service_type, status,
                       payment_method, payment_status, total, notes, created_at
                FROM orders
                ORDER BY created_at DESC
                LIMIT 100
                """, (rs, rowNum) -> historyOrder(
                rs.getLong("id"),
                rs.getString("order_number"),
                rs.getString("customer_name"),
                rs.getString("service_type"),
                rs.getString("status"),
                rs.getString("payment_method"),
                rs.getString("payment_status"),
                rs.getInt("total"),
                rs.getString("notes"),
                rs.getObject("created_at", OffsetDateTime.class).toString()
        ));
    }

    @Transactional
    public OrderHistoryResponse updateOrder(long id, UpdateOrderRequest request) {
        String serviceType = allowed(normalized(request.serviceType(), ""), Set.of("TAKEAWAY", "DINE_IN"), "tipo de servicio");
        String paymentMethod = allowed(normalized(request.paymentMethod(), ""), Set.of("CASH", "CARD", "TRANSFER"), "medio de pago");
        String status = allowed(normalized(request.status(), ""), Set.of("PAID", "PREPARING", "COMPLETED"), "estado");
        int updated = jdbc.update("""
                UPDATE orders
                SET customer_name = ?, service_type = ?, status = ?,
                    payment_method = ?, notes = ?, revision = revision + 1, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """, trimmed(request.customerName()), serviceType, status, paymentMethod, trimmed(request.notes()), id);
        if (updated == 0) {
            throw new IllegalArgumentException("La venta seleccionada no existe.");
        }
        return findHistoryOrder(id);
    }

    @Transactional(readOnly = true)
    public OrderHistoryResponse findHistoryOrder(long id) {
        OrderHistoryResponse order = jdbc.query("""
                        SELECT id, order_number, customer_name, service_type, status,
                               payment_method, payment_status, total, notes, created_at
                        FROM orders WHERE id = ?
                        """,
                rs -> rs.next() ? historyOrder(
                        rs.getLong("id"),
                        rs.getString("order_number"),
                        rs.getString("customer_name"),
                        rs.getString("service_type"),
                        rs.getString("status"),
                        rs.getString("payment_method"),
                        rs.getString("payment_status"),
                        rs.getInt("total"),
                        rs.getString("notes"),
                        rs.getObject("created_at", OffsetDateTime.class).toString()
                ) : null,
                id);
        if (order == null) throw new IllegalArgumentException("La venta seleccionada no existe.");
        return order;
    }

    /** Usa colecciones Java: evita exponer nodos Jackson 2 al serializador HTTP de Jackson 3. */
    private List<Map<String, Object>> historySelections(String value) {
        if (value == null || value.isBlank() || value.trim().equals("null")) return List.of();
        try {
            return objectMapper.readValue(value,
                    new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {});
        } catch (com.fasterxml.jackson.core.JsonProcessingException exception) {
            throw new IllegalStateException("Detalle histórico ilegible", exception);
        }
    }

    private OrderHistoryResponse historyOrder(
            long id, String number, String customer, String serviceType, String status,
            String paymentMethod, String paymentStatus, int total, String notes, String createdAt
    ) {
        List<OrderHistoryItem> items = jdbc.query("""
                SELECT menu_id, product_id, item_type, item_name, quantity, unit_price, total_price, selections_json
                FROM order_items WHERE order_id = ? ORDER BY id
                """, (rs, rowNum) -> new OrderHistoryItem(
                rs.getObject("menu_id", Long.class), rs.getObject("product_id", Long.class),
                rs.getString("item_type"),
                rs.getString("item_name"),
                rs.getInt("quantity"),
                rs.getInt("unit_price"),
                rs.getInt("total_price"),
                historySelections(rs.getString("selections_json"))
        ), id);
        return new OrderHistoryResponse(
                id, number, customer, serviceType, status, paymentMethod,
                paymentStatus, total, notes, createdAt, items,
                jdbc.queryForObject("SELECT revision FROM orders WHERE id=?", Integer.class, id)
        );
    }

    private List<MenuSectionResponse> sections(long menuId) {
        return jdbc.query("""
                SELECT ms.id, ms.label, ms.minimum_selections, ms.maximum_selections,
                       ms.required, c.slug
                FROM menu_sections ms
                JOIN categories c ON c.id = ms.category_id
                WHERE ms.menu_id = ?
                ORDER BY ms.display_order, ms.id
                """, (rs, rowNum) -> {
            long sectionId = rs.getLong("id");
            return new MenuSectionResponse(
                    sectionId,
                    rs.getString("label"),
                    rs.getString("slug"),
                    rs.getInt("minimum_selections"),
                    rs.getInt("maximum_selections"),
                    rs.getBoolean("required"),
                    options(sectionId)
            );
        }, menuId);
    }

    private List<MenuOptionResponse> options(long sectionId) {
        return jdbc.query("""
                SELECT mo.id, p.id product_id, p.name, p.description, p.price, mo.extra_price, p.stock
                FROM menu_options mo
                JOIN products p ON p.id = mo.product_id
                WHERE mo.menu_section_id = ?
                  AND mo.active = TRUE
                  AND p.active = TRUE
                ORDER BY mo.extra_price, p.name
                """, (rs, rowNum) -> new MenuOptionResponse(
                rs.getLong("id"),
                rs.getLong("product_id"),
                rs.getString("name"),
                rs.getString("description"),
                rs.getInt("price"),
                rs.getInt("extra_price"),
                rs.getDouble("stock")
        ), sectionId);
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        return createOrder(request, null);
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request, String createdByEmail) {
        return persistOrder(request, createdByEmail, null);
    }

    /** Corrige la misma venta atómicamente y conserva su versión anterior. */
    @Transactional
    public OrderResponse replaceOrder(long id, ReplaceOrderRequest request, String actor) {
        var revisions = jdbc.queryForList("SELECT revision FROM orders WHERE id=? FOR UPDATE", Integer.class, id);
        if (revisions.isEmpty()) throw new IllegalArgumentException("La venta no existe.");
        if (revisions.getFirst() != request.expectedRevision())
            throw new IllegalArgumentException("Otra persona modificó esta venta. Recarga el historial antes de editar.");
        jdbc.update("INSERT INTO order_revisions(order_id,previous_revision,snapshot_json,edited_by) VALUES (?,?,?,?)",
                id, revisions.getFirst(), json(findHistoryOrder(id)), actor);
        restoreOrderStock(id, "ingredients", "ingredient_movements", "ingredient_id");
        restoreOrderStock(id, "products", "inventory_movements", "product_id");
        return persistOrder(request.sale(), actor, id);
    }

    /** Devuelve el consumo neto original, no una receta que podría haber cambiado desde la venta. */
    private void restoreOrderStock(long orderId, String table, String movements, String column) {
        // Los identificadores provienen exclusivamente de las dos llamadas internas anteriores.
        var balances = jdbc.queryForList("SELECT " + column + " AS entity_id, -SUM(quantity) AS amount FROM "
                + movements + " WHERE order_id=? AND movement_type IN ('SALE','EDIT_RETURN') GROUP BY "
                + column + " ORDER BY " + column, orderId);
        for (var balance : balances) {
            long entityId = ((Number) balance.get("entity_id")).longValue();
            BigDecimal amount = (BigDecimal) balance.get("amount");
            if (amount.signum() <= 0) continue;
            BigDecimal previous = jdbc.queryForObject("SELECT stock FROM " + table + " WHERE id=? FOR UPDATE", BigDecimal.class, entityId);
            jdbc.update("UPDATE " + table + " SET stock=stock+?,updated_at=CURRENT_TIMESTAMP WHERE id=?", amount, entityId);
            jdbc.update("INSERT INTO " + movements + " (" + column
                    + ",order_id,movement_type,quantity,previous_stock,resulting_stock,reason) VALUES (?,?,'EDIT_RETURN',?,?,?,?)",
                    entityId, orderId, amount, previous, previous.add(amount), "Corrección de venta");
        }
    }

    private OrderResponse persistOrder(CreateOrderRequest request, String createdByEmail, Long existingId) {
        List<MenuItemRequest> requestedMenus = request.menus() == null ? List.of() : request.menus();
        List<ExtraItem> requestedExtras = request.extras() == null ? List.of() : request.extras();
        if (requestedMenus.isEmpty() && requestedExtras.isEmpty()) {
            throw new IllegalArgumentException("Agrega un menú o al menos un producto a la venta.");
        }

        int subtotal = 0;
        List<MenuSnapshot> menuSnapshots = new ArrayList<>();
        Map<Long, BigDecimal> stockRequirements = new LinkedHashMap<>();

        for (MenuItemRequest menuItem : requestedMenus) {
            if (menuItem.menuId() == null || menuItem.quantity() < 1) {
                throw new IllegalArgumentException("Cada menú debe tener una cantidad mayor que cero.");
            }
            MenuSnapshot snapshot = buildMenuSnapshot(
                    menuItem.menuId(),
                    menuItem.quantity(),
                    menuItem.selections() == null ? List.of() : menuItem.selections(),
                    stockRequirements
            );
            menuSnapshots.add(snapshot);
            subtotal += snapshot.totalPrice();
        }

        List<ProductLine> extraLines = new ArrayList<>();
        for (ExtraItem item : requestedExtras) {
            if (item.quantity() < 1) {
                throw new IllegalArgumentException("La cantidad de un producto debe ser mayor que cero.");
            }
            ProductLine product = productLine(item.productId(), item.quantity());
            extraLines.add(product);
            subtotal += product.totalPrice();
            stockRequirements.merge(product.productId(), BigDecimal.valueOf(item.quantity()), BigDecimal::add);
        }

        String orderNumber = "BP-" + OffsetDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"))
                + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase(Locale.ROOT);
        String serviceType = allowed(normalized(request.serviceType(), "TAKEAWAY"), Set.of("TAKEAWAY", "DINE_IN"), "tipo de servicio");
        String paymentMethod = allowed(normalized(request.paymentMethod(), "CASH"), Set.of("CASH", "CARD", "TRANSFER"), "medio de pago");
        String customerName = trimmed(request.customerName());
        String notes = trimmed(request.notes());
        Long createdBy = createdByEmail == null ? null : jdbc.query("""
                        SELECT id FROM app_users
                        WHERE LOWER(email) = LOWER(?) AND active = TRUE
                        """,
                result -> result.next() ? result.getLong("id") : null,
                createdByEmail
        );

        KeyHolder orderKey = new GeneratedKeyHolder();
        int finalSubtotal = subtotal;
        long orderId;
        if (existingId != null) {
            orderId = existingId;
            orderNumber = jdbc.queryForObject("SELECT order_number FROM orders WHERE id=?", String.class, orderId);
            jdbc.update("UPDATE orders SET customer_name=?,service_type=?,payment_method=?,subtotal=?,total=?,notes=?,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE id=?",
                    customerName, serviceType, paymentMethod, subtotal, subtotal, notes, orderId);
            jdbc.update("DELETE FROM order_items WHERE order_id=?", orderId);
        } else {
        final String newOrderNumber = orderNumber;
        jdbc.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO orders (
                        order_number, customer_name, channel, service_type, status,
                        payment_method, payment_status, subtotal, total, notes,
                        created_by, created_at, updated_at
                    ) VALUES (?, ?, 'POS', ?, 'PAID', ?, 'PAID', ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    """, new String[]{"id"});
            statement.setString(1, newOrderNumber);
            statement.setString(2, customerName);
            statement.setString(3, serviceType);
            statement.setString(4, paymentMethod);
            statement.setInt(5, finalSubtotal);
            statement.setInt(6, finalSubtotal);
            statement.setString(7, notes);
            if (createdBy == null) {
                statement.setNull(8, java.sql.Types.BIGINT);
            } else {
                statement.setLong(8, createdBy);
            }
            return statement;
        }, orderKey);
        orderId = Objects.requireNonNull(orderKey.getKey()).longValue();
        }

        for (MenuSnapshot menuSnapshot : menuSnapshots) {
            jdbc.update("""
                    INSERT INTO order_items (
                        order_id, menu_id, item_type, item_name, quantity,
                        unit_price, total_price, unit_cost, total_cost, selections_json
                    ) VALUES (?, ?, 'MENU', ?, ?, ?, ?, ?, ?, ?)
                    """,
                    orderId,
                    menuSnapshot.menuId(),
                    menuSnapshot.name(),
                    menuSnapshot.quantity(),
                    menuSnapshot.unitPrice(),
                    menuSnapshot.totalPrice(),
                    menuSnapshot.quantity() == 0 ? 0 : menuSnapshot.totalCost() / menuSnapshot.quantity(),
                    menuSnapshot.totalCost(),
                    json(menuSnapshot.selections())
            );
        }
        for (ProductLine line : extraLines) {
            jdbc.update("""
                    INSERT INTO order_items (
                        order_id, product_id, item_type, item_name, quantity,
                        unit_price, total_price, unit_cost, total_cost
                    ) VALUES (?, ?, 'PRODUCT', ?, ?, ?, ?, ?, ?)
                    """,
                    orderId,
                    line.productId(),
                    line.name(),
                    line.quantity(),
                    line.unitPrice(),
                    line.totalPrice(),
                    line.unitCost(),
                    line.totalCost()
            );
        }

        discountRequirements(stockRequirements, orderId, orderNumber, createdBy);

        return new OrderResponse(
                orderId,
                orderNumber,
                "PAID",
                "PAID",
                subtotal,
                subtotal,
                OffsetDateTime.now().toString()
        );
    }

    private MenuSnapshot buildMenuSnapshot(
            long menuId,
            int quantity,
            List<SectionSelection> requestedSelections,
            Map<Long, BigDecimal> stockRequirements
    ) {
        MenuBase menu = jdbc.query("""
                        SELECT id, name, base_price
                        FROM menus
                        WHERE id = ? AND active = TRUE
                          AND (available_from IS NULL OR available_from <= CURRENT_DATE)
                          AND (available_to IS NULL OR available_to >= CURRENT_DATE)
                        """,
                rs -> rs.next()
                        ? new MenuBase(rs.getLong("id"), rs.getString("name"), rs.getInt("base_price"))
                        : null,
                menuId
        );
        if (menu == null) {
            throw new IllegalArgumentException("El menú seleccionado no está disponible.");
        }

        Map<Long, List<OptionQuantity>> requestedBySection = new HashMap<>();
        for (SectionSelection selection : requestedSelections) {
            if (selection.sectionId() == null || requestedBySection.put(
                    selection.sectionId(),
                    selection.options() == null ? List.of() : selection.options()
            ) != null) {
                throw new IllegalArgumentException("Una sección del menú fue enviada más de una vez.");
            }
        }

        List<SectionRule> sectionRules = jdbc.query("""
                SELECT id, label, minimum_selections, maximum_selections
                FROM menu_sections
                WHERE menu_id = ?
                ORDER BY display_order, id
                """, (rs, rowNum) -> new SectionRule(
                rs.getLong("id"),
                rs.getString("label"),
                rs.getInt("minimum_selections"),
                rs.getInt("maximum_selections")
        ), menuId);

        int totalPrice = menu.basePrice() * quantity;
        int totalCost = 0;
        List<Map<String, Object>> snapshots = new ArrayList<>();
        Set<Long> validSections = new HashSet<>();
        for (SectionRule section : sectionRules) {
            validSections.add(section.id());
            List<OptionQuantity> optionQuantities = requestedBySection.getOrDefault(section.id(), List.of());
            int selectedQuantity = optionQuantities.stream().mapToInt(OptionQuantity::quantity).sum();
            if (selectedQuantity < section.minimum()) {
                throw new IllegalArgumentException(
                        section.label() + ": selecciona al menos " + section.minimum() + " porción."
                );
            }
            Set<Long> uniqueOptions = new HashSet<>();
            int includedRemaining = section.maximum();
            for (OptionQuantity requestedOption : optionQuantities) {
                if (requestedOption.optionId() == null || requestedOption.quantity() < 1
                        || !uniqueOptions.add(requestedOption.optionId())) {
                    throw new IllegalArgumentException(section.label() + ": las cantidades enviadas no son válidas.");
                }
                SelectedOption option = selectedOption(section.id(), requestedOption.optionId());
                int includedForOption = Math.min(includedRemaining, requestedOption.quantity());
                int extraUnits = requestedOption.quantity() - includedForOption;
                includedRemaining -= includedForOption;
                // La cantidad multiplica el menú y su consumo de inventario, no los recargos
                // elegidos en una única configuración de la línea de venta.
                totalPrice += option.extraPrice() * requestedOption.quantity() + option.price() * extraUnits;
                totalCost += option.unitCost() * requestedOption.quantity() * quantity;
                stockRequirements.merge(
                        option.productId(),
                        BigDecimal.valueOf((long) requestedOption.quantity() * quantity),
                        BigDecimal::add
                );
                Map<String, Object> snapshot = new LinkedHashMap<>();
                snapshot.put("sectionId", section.id());
                snapshot.put("section", section.label());
                snapshot.put("optionId", option.id());
                snapshot.put("productId", option.productId());
                snapshot.put("name", option.name());
                snapshot.put("quantity", requestedOption.quantity());
                snapshot.put("totalQuantity", requestedOption.quantity() * quantity);
                snapshot.put("extraUnitsPerMenu", extraUnits);
                snapshot.put("extraPrice", option.extraPrice());
                snapshots.add(snapshot);
            }
        }
        if (!validSections.containsAll(requestedBySection.keySet())) {
            throw new IllegalArgumentException("Una selección no pertenece al menú elegido.");
        }
        return new MenuSnapshot(menu.id(), menu.name(), quantity, menu.basePrice(), totalPrice, totalCost, snapshots);
    }

    private SelectedOption selectedOption(long sectionId, long optionId) {
        SelectedOption option = jdbc.query("""
                        SELECT mo.id, mo.product_id, p.name, p.price, mo.extra_price, p.unit_cost
                        FROM menu_options mo
                        JOIN products p ON p.id = mo.product_id
                        WHERE mo.id = ? AND mo.menu_section_id = ?
                          AND mo.active = TRUE AND p.active = TRUE
                        """,
                rs -> rs.next()
                        ? new SelectedOption(
                                rs.getLong("id"),
                                rs.getLong("product_id"),
                                rs.getString("name"),
                                rs.getInt("price"),
                                rs.getInt("extra_price"),
                                rs.getInt("unit_cost")
                        )
                        : null,
                optionId,
                sectionId
        );
        if (option == null) {
            throw new IllegalArgumentException("Una opción seleccionada no está disponible.");
        }
        return option;
    }

    private ProductLine productLine(long productId, int quantity) {
        ProductLine line = jdbc.query("""
                        SELECT id, name, price, unit_cost
                        FROM products
                        WHERE id = ? AND active = TRUE
                        """,
                rs -> rs.next()
                        ? new ProductLine(
                                rs.getLong("id"),
                                rs.getString("name"),
                                quantity,
                                rs.getInt("price"),
                                rs.getInt("price") * quantity,
                                rs.getInt("unit_cost"),
                                rs.getInt("unit_cost") * quantity
                        )
                        : null,
                productId
        );
        if (line == null) {
            throw new IllegalArgumentException("Uno de los productos adicionales no está disponible.");
        }
        return line;
    }

    private void discountStock(long productId, BigDecimal quantity, long orderId, String orderNumber) {
        StockRow stock = jdbc.query("""
                        SELECT name, stock, track_stock
                        FROM products
                        WHERE id = ? AND active = TRUE
                        FOR UPDATE
                        """,
                rs -> rs.next()
                        ? new StockRow(rs.getString("name"), rs.getBigDecimal("stock"), rs.getBoolean("track_stock"))
                        : null,
                productId
        );
        if (stock == null) {
            throw new IllegalArgumentException("Un producto seleccionado ya no está disponible.");
        }
        if (!stock.trackStock()) {
            return;
        }
        if (stock.stock().compareTo(quantity) < 0) {
            throw new IllegalArgumentException("Stock insuficiente para " + stock.name() + ".");
        }
        BigDecimal resulting = stock.stock().subtract(quantity);
        jdbc.update("UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", resulting, productId);
        jdbc.update("""
                INSERT INTO inventory_movements (
                    product_id, order_id, movement_type, quantity,
                    previous_stock, resulting_stock, reason, created_at
                ) VALUES (?, ?, 'SALE', ?, ?, ?, ?, CURRENT_TIMESTAMP)
                """,
                productId,
                orderId,
                quantity.negate(),
                stock.stock(),
                resulting,
                "Venta " + orderNumber
        );
    }

    /**
     * Convierte platos vendidos en consumo de materias primas. Los productos que
     * aún no poseen receta conservan temporalmente el descuento directo anterior.
     */
    private void discountRequirements(
            Map<Long, BigDecimal> productRequirements,
            long orderId,
            String orderNumber,
            Long createdBy
    ) {
        Map<Long, BigDecimal> ingredientRequirements = new LinkedHashMap<>();
        Map<Long, String> ingredientSources = new LinkedHashMap<>();
        Map<Long, BigDecimal> legacyRequirements = new LinkedHashMap<>();

        productRequirements.forEach((productId, portions) -> {
            ProductPreparation preparation = jdbc.query("""
                    SELECT p.name, c.slug, r.id AS recipe_id, r.yield_quantity
                    FROM products p JOIN categories c ON c.id=p.category_id
                    LEFT JOIN recipes r ON r.product_id=p.id AND r.active=TRUE
                    WHERE p.id=? AND p.active=TRUE
                    """, rs -> rs.next() ? new ProductPreparation(
                    rs.getString("name"), rs.getString("slug"),
                    rs.getObject("recipe_id", Long.class), rs.getBigDecimal("yield_quantity")) : null, productId);
            if (preparation == null) throw new IllegalArgumentException("Un producto de la venta ya no está disponible.");
            // Bebestibles llegan terminados desde el proveedor y se controlan por unidad.
            if ("bebestibles".equals(preparation.categorySlug())) {
                legacyRequirements.merge(productId, portions, BigDecimal::add);
                return;
            }
            if (preparation.recipeId() == null) {
                throw new IllegalArgumentException("El producto preparado " + preparation.productName()
                        + " no tiene receta. Configúrala en Inventario antes de venderlo.");
            }
            jdbc.query("""
                    SELECT ri.ingredient_id, ri.quantity
                    FROM recipe_ingredients ri JOIN ingredients i ON i.id=ri.ingredient_id
                    WHERE ri.recipe_id=? AND i.active=TRUE
                    """, rs -> {
                long ingredientId = rs.getLong("ingredient_id");
                BigDecimal required = rs.getBigDecimal("quantity")
                        .multiply(portions)
                        .divide(preparation.yieldQuantity(), 3, RoundingMode.HALF_UP);
                ingredientRequirements.merge(ingredientId, required, BigDecimal::add);
                ingredientSources.merge(ingredientId, preparation.productName(), (left, right) -> left + ", " + right);
            }, preparation.recipeId());
        });

        // Orden estable para reducir riesgo de interbloqueo entre ventas simultáneas.
        ingredientRequirements.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .forEach(entry -> discountIngredient(
                        entry.getKey(), entry.getValue(), orderId, orderNumber,
                        ingredientSources.get(entry.getKey()), createdBy));
        legacyRequirements.forEach((productId, quantity) ->
                discountStock(productId, quantity, orderId, orderNumber));
    }

    private void discountIngredient(
            long ingredientId,
            BigDecimal quantity,
            long orderId,
            String orderNumber,
            String source,
            Long createdBy
    ) {
        IngredientStock stock = jdbc.query("""
                SELECT name, base_unit, stock FROM ingredients
                WHERE id=? AND active=TRUE FOR UPDATE
                """, rs -> rs.next() ? new IngredientStock(
                rs.getString("name"), rs.getString("base_unit"), rs.getBigDecimal("stock")) : null,
                ingredientId);
        if (stock == null) throw new IllegalArgumentException("Una materia prima de la receta ya no está disponible.");
        if (stock.stock().compareTo(quantity) < 0) {
            throw new IllegalArgumentException("Stock insuficiente de " + stock.name()
                    + ": se necesitan " + quantity.stripTrailingZeros().toPlainString() + " " + stock.baseUnit().toLowerCase(Locale.ROOT) + ".");
        }
        BigDecimal resulting = stock.stock().subtract(quantity);
        jdbc.update("UPDATE ingredients SET stock=?, updated_at=CURRENT_TIMESTAMP WHERE id=?", resulting, ingredientId);
        jdbc.update("""
                INSERT INTO ingredient_movements (
                    ingredient_id, order_id, movement_type, quantity,
                    previous_stock, resulting_stock, reason, created_by, created_at
                ) VALUES (?, ?, 'SALE', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                """, ingredientId, orderId, quantity.negate(), stock.stock(), resulting,
                "Venta " + orderNumber + " · " + source, createdBy);
    }

    private String json(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("No fue posible guardar las selecciones del menú.", exception);
        }
    }

    private String normalized(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim().toUpperCase(Locale.ROOT);
    }

    private String trimmed(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String allowed(String value, Set<String> allowed, String field) {
        if (!allowed.contains(value)) {
            throw new IllegalArgumentException("El " + field + " no es válido.");
        }
        return value;
    }

    private record MenuBase(long id, String name, int basePrice) {}
    private record SectionRule(long id, String label, int minimum, int maximum) {}
    private record SelectedOption(long id, long productId, String name, int price, int extraPrice, int unitCost) {}
    private record MenuSnapshot(
            long menuId,
            String name,
            int quantity,
            int unitPrice,
            int totalPrice,
            int totalCost,
            List<Map<String, Object>> selections
    ) {}
    private record ProductLine(
            long productId,
            String name,
            int quantity,
            int unitPrice,
            int totalPrice,
            int unitCost,
            int totalCost
    ) {}
    private record StockRow(String name, BigDecimal stock, boolean trackStock) {}
    private record ProductPreparation(String productName, String categorySlug, Long recipeId, BigDecimal yieldQuantity) {}
    private record IngredientStock(String name, String baseUnit, BigDecimal stock) {}
}
