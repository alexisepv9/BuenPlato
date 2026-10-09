package cl.buenplato;

import cl.buenplato.catalog.CatalogDtos.ProductCreateRequest;
import cl.buenplato.catalog.CatalogDtos.ProductUpdateRequest;
import cl.buenplato.catalog.Category;
import cl.buenplato.catalog.CategoryRepository;
import cl.buenplato.catalog.CatalogService;
import cl.buenplato.catalog.ProductRepository;
import cl.buenplato.sales.SalesDtos.CreateOrderRequest;
import cl.buenplato.sales.SalesDtos.MenuItemRequest;
import cl.buenplato.sales.SalesDtos.OptionQuantity;
import cl.buenplato.sales.SalesDtos.SectionSelection;
import cl.buenplato.sales.SalesService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class BackendApplicationTests {
    @Autowired
    private CatalogService catalogService;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private SalesService salesService;

    @Autowired
    private JdbcTemplate jdbc;


    @Test
    void contextLoads() {
    }

    @Test
    @Transactional
    void createsAProductAndRollsBackAfterTheTest() {
        var category = categoryRepository.save(
                new Category("Proteínas", "proteinas-test", "COMPONENT", 1)
        );
        var created = catalogService.createProduct(new ProductCreateRequest(
                category.getId(),
                "QA-TRANSACCIONAL",
                "Producto de validación",
                "Este registro nunca queda persistido.",
                2500,
                "porciones",
                BigDecimal.TEN,
                BigDecimal.valueOf(3),
                true
        ));

        assertThat(created.id()).isNotNull();
        assertThat(created.name()).isEqualTo("Producto de validación");
        assertThat(created.stockStatus()).isEqualTo("NORMAL");
    }

    @Test
    @Transactional
    void updatesAndSoftDeletesAProduct() {
        var category = categoryRepository.save(
                new Category("Agregados", "agregados-edicion-test", "COMPONENT", 2)
        );
        var created = catalogService.createProduct(new ProductCreateRequest(
                category.getId(), "QA-EDITAR", "Arroz", "", 1200, "porciones",
                BigDecimal.TEN, BigDecimal.valueOf(3), true
        ));

        var updated = catalogService.updateProduct(created.id(), new ProductUpdateRequest(
                category.getId(), "QA-EDITAR", "Arroz integral", "Actualizado", 1500, "porciones",
                BigDecimal.valueOf(2), BigDecimal.valueOf(4), true
        ));
        assertThat(updated.name()).isEqualTo("Arroz integral");
        assertThat(updated.stockStatus()).isEqualTo("LOW_STOCK");

        catalogService.deleteProduct(created.id());
        assertThat(productRepository.findById(created.id())).get()
                .extracting("active")
                .isEqualTo(false);
    }

    @Test
    @Transactional
    void createsAnOrderAndDiscountsInventoryInOneTransaction() {
        var category = categoryRepository.save(
                new Category("Proteína venta", "proteina-venta-test", "COMPONENT", 1)
        );
        var product = catalogService.createProduct(new ProductCreateRequest(
                category.getId(), "QA-VENTA", "Pollo de prueba", "", 3500, "porciones",
                BigDecimal.TEN, BigDecimal.valueOf(2), true
        ));
        // Todo alimento preparado necesita receta; esta prueba valida el descuento
        // real de materia prima en lugar del stock heredado por porciones.
        jdbc.update("INSERT INTO ingredients(sku,name,base_unit,stock,low_stock_threshold,unit_cost) VALUES ('QA-ING','Ingrediente QA','G',10,2,1)");
        Long ingredientId = jdbc.queryForObject("SELECT id FROM ingredients WHERE sku='QA-ING'", Long.class);
        jdbc.update("INSERT INTO recipes(product_id,yield_quantity) VALUES (?,1)", product.id());
        Long recipeId = jdbc.queryForObject("SELECT id FROM recipes WHERE product_id=?", Long.class, product.id());
        jdbc.update("INSERT INTO recipe_ingredients(recipe_id,ingredient_id,quantity) VALUES (?,?,1)", recipeId, ingredientId);

        jdbc.update("""
                INSERT INTO menus (name, description, base_price, active, created_at)
                VALUES ('Menú transaccional QA', 'Prueba', 6500, TRUE, CURRENT_TIMESTAMP)
                """);
        Long menuId = jdbc.queryForObject(
                "SELECT id FROM menus WHERE name = 'Menú transaccional QA'",
                Long.class
        );
        jdbc.update("""
                INSERT INTO menu_sections (
                    menu_id, category_id, label, minimum_selections,
                    maximum_selections, required, display_order
                ) VALUES (?, ?, 'Proteína', 1, 1, TRUE, 1)
                """, menuId, category.getId());
        Long sectionId = jdbc.queryForObject(
                "SELECT id FROM menu_sections WHERE menu_id = ?",
                Long.class,
                menuId
        );
        jdbc.update("""
                INSERT INTO menu_options (menu_section_id, product_id, extra_price, active)
                VALUES (?, ?, 500, TRUE)
                """, sectionId, product.id());
        Long optionId = jdbc.queryForObject(
                "SELECT id FROM menu_options WHERE menu_section_id = ?",
                Long.class,
                sectionId
        );

        var order = salesService.createOrder(new CreateOrderRequest(
                List.of(new MenuItemRequest(
                        menuId,
                        2,
                        List.of(new SectionSelection(
                                sectionId,
                                List.of(new OptionQuantity(optionId, 1))
                        ))
                )),
                List.of(),
                "Cliente QA",
                "TAKEAWAY",
                "CASH",
                null
        ));

        assertThat(order.total()).isEqualTo(13500);
        // El historial conserva la composición y precios originales, no el catálogo vigente.
        var historical = salesService.orderHistory().stream()
                .filter(sale -> sale.id().equals(order.id())).findFirst().orElseThrow();
        assertThat(historical.items()).hasSize(1);
        assertThat(historical.items().getFirst().selections().getFirst().get("name")).isEqualTo("Pollo de prueba");
        assertThat(historical.items().getFirst().selections().getFirst().get("totalQuantity")).isEqualTo(2);
        // Comprueba también el contrato JSON con el serializador HTTP de Spring Boot 4.
        var httpMapper = new tools.jackson.databind.json.JsonMapper();
        var responseJson = httpMapper.readTree(httpMapper.writeValueAsString(historical));
        assertThat(responseJson.get("items").get(0).get("selections").isArray()).isTrue();
        assertThat(responseJson.get("items").get(0).get("selections").get(0).get("name").asText())
                .isEqualTo("Pollo de prueba");
        assertThat(jdbc.queryForObject("SELECT stock FROM ingredients WHERE id = ?", BigDecimal.class, ingredientId))
                .isEqualByComparingTo("8.000");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM order_items WHERE order_id = ?", Integer.class, order.id()))
                .isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM ingredient_movements WHERE order_id = ?", Integer.class, order.id()))
                .isEqualTo(1);
        // Corregir usa el consumo histórico para devolver stock y la receta vigente para descontar.
        jdbc.update("UPDATE recipe_ingredients SET quantity=3 WHERE recipe_id=?", recipeId);
        var correction = new CreateOrderRequest(List.of(new MenuItemRequest(menuId, 1,
                List.of(new SectionSelection(sectionId, List.of(new OptionQuantity(optionId, 1)))))),
                List.of(), "Cliente corregido", "TAKEAWAY", "CARD", "Cambio de pedido");
        var corrected = salesService.replaceOrder(order.id(), new cl.buenplato.sales.SalesDtos.ReplaceOrderRequest(correction, 0), "admin-test");
        assertThat(corrected.id()).isEqualTo(order.id());
        assertThat(corrected.orderNumber()).isEqualTo(order.orderNumber());
        assertThat(corrected.total()).isEqualTo(7000);
        assertThat(jdbc.queryForObject("SELECT stock FROM ingredients WHERE id=?", BigDecimal.class, ingredientId)).isEqualByComparingTo("7");
        salesService.replaceOrder(order.id(), new cl.buenplato.sales.SalesDtos.ReplaceOrderRequest(correction, 1), "admin-test");
        assertThat(jdbc.queryForObject("SELECT stock FROM ingredients WHERE id=?", BigDecimal.class, ingredientId)).isEqualByComparingTo("7");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM order_revisions WHERE order_id=?", Integer.class, order.id())).isEqualTo(2);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> salesService.replaceOrder(order.id(),
                new cl.buenplato.sales.SalesDtos.ReplaceOrderRequest(correction, 0), "admin-test"))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Otra persona");
    }
}
