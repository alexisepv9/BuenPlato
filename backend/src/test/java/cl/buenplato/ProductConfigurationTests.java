package cl.buenplato;

import cl.buenplato.catalog.CatalogDtos.ProductCreateRequest;
import cl.buenplato.catalog.ProductConfigurationController;
import cl.buenplato.catalog.ProductConfigurationController.*;
import cl.buenplato.inventory.InventoryService;
import cl.buenplato.inventory.InventoryDtos.*;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import static org.assertj.core.api.Assertions.*;

/** Un producto mantiene su identidad al cambiar su política de inventario. */
@SpringBootTest
@Transactional
class ProductConfigurationTests {
    @Autowired ProductConfigurationController controller;
    @Autowired InventoryService inventory;
    @Autowired JdbcTemplate jdbc;
    @Autowired cl.buenplato.sales.SalesService sales;
    @Autowired jakarta.persistence.EntityManager entities;

    @Test void switchesModesWithoutChangingIdentityOrInventingStock() {
        jdbc.update("INSERT INTO categories(name,slug,category_type,display_order,active) VALUES ('Genérica QA','generic-qa','STANDALONE',99,TRUE)");
        long category = jdbc.queryForObject("SELECT id FROM categories WHERE slug='generic-qa'",Long.class);
        var product = new ProductCreateRequest(category,"Artículo genérico","",1500,"unidades",BigDecimal.TEN,BigDecimal.ONE,true);
        var created = controller.create(new Configuration(product,Mode.PRODUCT,BigDecimal.ONE,List.of()));
        assertThat(inventory.listRecipes()).noneMatch(r -> r.productId()==created.id());
        var ingredient = inventory.createIngredient(new IngredientRequest(1L,"Componente QA","G",BigDecimal.TEN,BigDecimal.ONE,BigDecimal.ONE,null));
        var composition = List.of(new RecipeComponentRequest(ingredient.id(),BigDecimal.ONE,"G"));
        controller.update(created.id(),new Configuration(product,Mode.COMPOSITION,BigDecimal.ONE,composition));
        assertThat(inventory.listRecipes()).anyMatch(r -> r.productId()==created.id());
        var untracked = controller.update(created.id(),new Configuration(product,Mode.NONE,BigDecimal.ONE,List.of()));
        assertThat(untracked.trackStock()).isFalse();
        assertThat(untracked.stock()).isEqualByComparingTo("10");
        assertThat(inventory.listRecipes()).noneMatch(r -> r.productId()==created.id());
        var direct = controller.update(created.id(),new Configuration(product,Mode.PRODUCT,BigDecimal.ONE,List.of()));
        assertThat(direct.id()).isEqualTo(created.id());
        assertThat(direct.trackStock()).isTrue();
        sell(created.id());
        assertThat(jdbc.queryForObject("SELECT stock FROM products WHERE id=?",BigDecimal.class,created.id())).isEqualByComparingTo("9");
        controller.update(created.id(),new Configuration(product,Mode.COMPOSITION,BigDecimal.ONE,composition));
        sell(created.id());
        assertThat(jdbc.queryForObject("SELECT stock FROM ingredients WHERE id=?",BigDecimal.class,ingredient.id())).isEqualByComparingTo("9");
        assertThat(jdbc.queryForObject("SELECT stock FROM products WHERE id=?",BigDecimal.class,created.id())).isEqualByComparingTo("10");
        controller.update(created.id(),new Configuration(product,Mode.NONE,BigDecimal.ONE,List.of()));
        sell(created.id());
        assertThat(jdbc.queryForObject("SELECT stock FROM ingredients WHERE id=?",BigDecimal.class,ingredient.id())).isEqualByComparingTo("9");
        assertThat(jdbc.queryForObject("SELECT stock FROM products WHERE id=?",BigDecimal.class,created.id())).isEqualByComparingTo("10");
    }

    /** Venta de un artículo de categoría genérica: no depende de ser bebida o comida. */
    private void sell(long id) {
        sales.createOrder(new cl.buenplato.sales.SalesDtos.CreateOrderRequest(List.of(),
                List.of(new cl.buenplato.sales.SalesDtos.ExtraItem(id,1)),null,"TAKEAWAY","CASH",null));
        // Simula el límite entre peticiones HTTP: ventas usa JDBC, no la caché JPA del test.
        entities.clear();
    }
}
