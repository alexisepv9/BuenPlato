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
                  AND (p.track_stock = FALSE OR p.stock > 0)
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
                    payment_method = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """, trimmed(request.customerName()), serviceType, status, paymentMethod, trimmed(request.notes()), id);
        if (updated == 0) {
            throw new IllegalArgumentException("La venta seleccionada no existe.");
        }
        return findHistoryOrder(id);
    }

    private OrderHistoryResponse findHistoryOrder(long id) {
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

    private OrderHistoryResponse historyOrder(
            long id, String number, String customer, String serviceType, String status,
            String paymentMethod, String paymentStatus, int total, String notes, String createdAt
    ) {
        List<OrderHistoryItem> items = jdbc.query("""
                SELECT item_type, item_name, quantity, unit_price, total_price
                FROM order_items WHERE order_id = ? ORDER BY id
                """, (rs, rowNum) -> new OrderHistoryItem(
                rs.getString("item_type"),
                rs.getString("item_name"),
                rs.getInt("quantity"),
                rs.getInt("unit_price"),
                rs.getInt("total_price")
        ), id);
        return new OrderHistoryResponse(
                id, number, customer, serviceType, status, paymentMethod,
                paymentStatus, total, notes, createdAt, items
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
                  AND (p.track_stock = FALSE OR p.stock > 0)
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
        String serviceType = normalized(request.serviceType(), "TAKEAWAY");
        String paymentMethod = normalized(request.paymentMethod(), "CASH");
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
        jdbc.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO orders (
                        order_number, customer_name, channel, service_type, status,
                        payment_method, payment_status, subtotal, total, notes,
                        created_by, created_at, updated_at
                    ) VALUES (?, ?, 'POS', ?, 'PAID', ?, 'PAID', ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    """, new String[]{"id"});
            statement.setString(1, orderNumber);
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
        long orderId = Objects.requireNonNull(orderKey.getKey()).longValue();

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

        stockRequirements.forEach((productId, quantity) ->
                discountStock(productId, quantity, orderId, orderNumber));

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
}
