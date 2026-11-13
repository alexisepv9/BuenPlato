package cl.buenplato;

import cl.buenplato.inventory.IngredientCategoryController;
import cl.buenplato.inventory.InventoryService;
import cl.buenplato.inventory.InventoryDtos.IngredientRequest;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import static org.assertj.core.api.Assertions.*;

/** Prueba persistencia de categorías y conservación de cantidades e identificadores. */
@SpringBootTest
@Transactional
class IngredientCategoriesTests {
    @Autowired IngredientCategoryController categories;
    @Autowired InventoryService inventory;
    @Autowired JdbcTemplate jdbc;

    @Test void renamesAndReassignsWithoutLosingStock() {
        var all = categories.create(new IngredientCategoryController.Request("Categoría QA"));
        long id = all.stream().filter(c -> c.name().equals("Categoría QA")).findFirst().orElseThrow().id();
        var ingredient = inventory.createIngredient(new IngredientRequest(id,"Aceite QA","L",new BigDecimal("2.5"),BigDecimal.ONE,BigDecimal.TEN,null));
        categories.rename(id,new IngredientCategoryController.Request("Líquidos QA"));
        assertThat(jdbc.queryForObject("SELECT category_id FROM ingredients WHERE id=?",Long.class,ingredient.id())).isEqualTo(id);
        categories.deactivate(id,1L);
        assertThat(jdbc.queryForObject("SELECT category_id FROM ingredients WHERE id=?",Long.class,ingredient.id())).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT stock FROM ingredients WHERE id=?",BigDecimal.class,ingredient.id())).isEqualByComparingTo("2500");
        assertThat(categories.list()).noneMatch(c -> c.id()==id);
    }
    @Test void protectsUsedCategoriesAndRejectsMissingCategory() {
        var all = categories.create(new IngredientCategoryController.Request("En uso QA"));
        long id = all.stream().filter(c -> c.name().equals("En uso QA")).findFirst().orElseThrow().id();
        inventory.createIngredient(new IngredientRequest(id,"Sal QA","G",BigDecimal.TEN,BigDecimal.ONE,BigDecimal.ONE,null));
        assertThatThrownBy(() -> categories.deactivate(id,null)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> inventory.createIngredient(new IngredientRequest(999999L,"Sal QA","G",BigDecimal.ONE,BigDecimal.ONE,BigDecimal.ONE,null))).isInstanceOf(IllegalArgumentException.class);
    }
}
