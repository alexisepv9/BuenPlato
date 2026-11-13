package cl.buenplato;

import cl.buenplato.inventory.InventoryService;
import cl.buenplato.inventory.InventoryDtos.*;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import static org.assertj.core.api.Assertions.assertThat;

/** Regresión: añadir una receta a un producto sin preparación y editarla después. */
@SpringBootTest
@Transactional
class RecipePersistenceTests {
    @Autowired InventoryService inventory;
    @Autowired JdbcTemplate jdbc;

    @Test void createsThenUpdatesRecipeWithoutOverwritingProductParameter() {
        jdbc.update("INSERT INTO categories(name,slug,category_type,display_order,active) VALUES ('QA receta','qa-receta','COMPONENT',99,TRUE)");
        long category = jdbc.queryForObject("SELECT id FROM categories WHERE slug='qa-receta'",Long.class);
        jdbc.update("INSERT INTO products(category_id,name,description,price,unit,stock,low_stock_threshold,track_stock,active) VALUES (?,'Plato QA receta','',1000,'PORCION',0,0,TRUE,TRUE)",category);
        long product = jdbc.queryForObject("SELECT id FROM products WHERE name='Plato QA receta'",Long.class);
        var ingredient = inventory.createIngredient(new IngredientRequest(1L,"Arroz QA receta","G",new BigDecimal("1000"),BigDecimal.ONE,BigDecimal.ONE,null));
        var components = List.of(new RecipeComponentRequest(ingredient.id(),new BigDecimal("100"),"G"));
        var created = inventory.saveRecipe(product,new RecipeRequest("Plato QA receta",new BigDecimal("4"),components));
        assertThat(created.productId()).isEqualTo(product);
        assertThat(created.yieldQuantity()).isEqualByComparingTo("4");
        var updated = inventory.saveRecipe(product,new RecipeRequest("Plato QA editado",new BigDecimal("8"),components));
        assertThat(updated.id()).isEqualTo(created.id());
        assertThat(updated.yieldQuantity()).isEqualByComparingTo("8");
        inventory.saveRecipe(product,new RecipeRequest("Plato QA editado",BigDecimal.ONE,List.of()));
        assertThat(jdbc.queryForObject("SELECT active FROM recipes WHERE id=?",Boolean.class,created.id())).isFalse();
        assertThat(inventory.listRecipes()).noneMatch(recipe -> recipe.productId() == product);
        var restored = inventory.saveRecipe(product,new RecipeRequest("Plato QA editado",BigDecimal.ONE,components));
        assertThat(restored.id()).isEqualTo(created.id());
    }
}
