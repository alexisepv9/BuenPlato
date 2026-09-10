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
        assertThat(jdbc.queryForObject("SELECT stock FROM products WHERE id = ?", BigDecimal.class, product.id()))
                .isEqualByComparingTo("8.00");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM order_items WHERE order_id = ?", Integer.class, order.id()))
                .isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM inventory_movements WHERE order_id = ?", Integer.class, order.id()))
                .isEqualTo(1);
    }
}
