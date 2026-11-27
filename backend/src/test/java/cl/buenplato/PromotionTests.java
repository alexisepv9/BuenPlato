/** Integración de promociones: configuración, reglas de venta, stock, vigencia y autorización. */
package cl.buenplato;

import cl.buenplato.catalog.MenuConfigurationService;
import cl.buenplato.catalog.MenuConfigurationService.*;
import cl.buenplato.sales.SalesService;
import cl.buenplato.sales.SalesDtos.*;
import cl.buenplato.inventory.InventoryService;
import cl.buenplato.inventory.InventoryDtos.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Transactional
class PromotionTests {
    @Autowired MenuConfigurationService offers;
    @Autowired SalesService sales;
    @Autowired InventoryService inventory;
    @Autowired JdbcTemplate jdbc;
    @Autowired WebApplicationContext context;
    @Autowired cl.buenplato.finance.ProductDemandService demand;
    long category,product;

    @BeforeEach void fixture() {
        category=jdbc.queryForObject("SELECT id FROM categories WHERE slug='completos'",Long.class);
        jdbc.update("INSERT INTO products(category_id,name,price,stock) VALUES (?,'Completo QA promo',3000,20)",category);
        product=jdbc.queryForObject("SELECT id FROM products WHERE name='Completo QA promo'",Long.class);
    }
    Configuration config(String kind,LocalDate from,LocalDate to) {
        return new Configuration("Promo QA " + kind,"Dos completos",kind,5000,from,to,true,0,
            List.of(new Section(category,"Elige dos",2,2,List.of(new Option(product,100)))));
    }
    CreateOrderRequest request(long id,int quantity,int selected) {
        var menu=sales.catalog().menus().stream().filter(m->m.id()==id).findFirst().orElseThrow();
        var section=menu.sections().getFirst();
        return new CreateOrderRequest(List.of(new MenuItemRequest(id,quantity,List.of(new SectionSelection(section.id(),List.of(new OptionQuantity(section.options().getFirst().id(),selected)))))),List.of(),null,"TAKEAWAY","CASH",null);
    }
    @Test void promotionMultipliesPriceAndConsumesComponentsExactlyOnce() {
        long id=offers.save(null,config("PROMOTION",null,null));
        assertThat(sales.catalog().menus()).anyMatch(m->m.id()==id && m.kind().equals("PROMOTION"));
        var order=sales.createOrder(request(id,3,2));
        assertThat(order.total()).isEqualTo(15600);
        var ranked = demand.ranking(LocalDate.now(), LocalDate.now()).stream()
                .filter(item -> item.productId() == product).findFirst().orElseThrow();
        assertThat(ranked.quantity()).isEqualTo(6);
        assertThat(ranked.offerQuantity()).isEqualTo(6);
        assertThat(ranked.directQuantity()).isZero();
        assertThat(jdbc.queryForObject("SELECT stock FROM products WHERE id=?",BigDecimal.class,product)).isEqualByComparingTo("14");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM inventory_movements WHERE order_id=?",Integer.class,order.id())).isEqualTo(1);
        offers.deactivate(id);
        assertThat(sales.catalog().menus()).noneMatch(m->m.id()==id);
        assertThat(sales.orderHistory()).anyMatch(o->o.id().equals(order.id()) && o.total()==15600);
        jdbc.update("UPDATE orders SET status='CANCELLED' WHERE id=?", order.id());
        assertThat(demand.ranking(LocalDate.now(), LocalDate.now())).noneMatch(item -> item.productId() == product);
    }
    @Test void preservesColacionPricingAndChargesAdditionalUnitsInPromotions() {
        long colacion=offers.save(null,config("COLACION",null,null));
        assertThat(sales.createOrder(request(colacion,2,2)).total()).isEqualTo(10200);
        long promo=offers.save(null,config("PROMOTION",null,null));
        assertThat(sales.createOrder(request(promo,2,3)).total()).isEqualTo(16600);
    }

    /** La demanda suma ambos canales sin duplicar la oferta ni mezclar el filtro de fechas. */
    @Test void demandCombinesDirectSalesAndOffers() {
        long id = offers.save(null, config("PROMOTION", null, null));
        sales.createOrder(request(id, 3, 2));
        sales.createOrder(new CreateOrderRequest(List.of(), List.of(new ExtraItem(product, 2)),
                null, "TAKEAWAY", "CASH", null));
        var item = demand.ranking(LocalDate.now(), LocalDate.now()).stream()
                .filter(row -> row.productId() == product).findFirst().orElseThrow();
        assertThat(item.directQuantity()).isEqualTo(2);
        assertThat(item.offerQuantity()).isEqualTo(6);
        assertThat(item.quantity()).isEqualTo(8);
        assertThat(demand.ranking(LocalDate.now().minusDays(2), LocalDate.now().minusDays(1)))
                .noneMatch(row -> row.productId() == product);
    }
    @Test void recipeConsumesIngredientsNotBothStocks() {
        var ingredient=inventory.createIngredient(new IngredientRequest(1L,"Pan QA promo","UNIT",new BigDecimal("20"),BigDecimal.ONE,BigDecimal.ONE,null));
        inventory.saveRecipe(product,new RecipeRequest("Completo QA promo",BigDecimal.ONE,List.of(new RecipeComponentRequest(ingredient.id(),BigDecimal.ONE,"UNIT"))));
        long id=offers.save(null,config("PROMOTION",null,null));
        sales.createOrder(request(id,2,2));
        assertThat(jdbc.queryForObject("SELECT stock FROM ingredients WHERE id=?",BigDecimal.class,ingredient.id())).isEqualByComparingTo("16");
        assertThat(jdbc.queryForObject("SELECT stock FROM products WHERE id=?",BigDecimal.class,product)).isEqualByComparingTo("20");
    }
    @Test void rejectsWrongCategoryAndInvalidDates() {
        var bad=new Configuration("Inválida","","PROMOTION",100,null,null,true,0,List.of(new Section(-1L,"Otra",1,1,List.of(new Option(product,0)))));
        assertThatThrownBy(()->offers.save(null,bad)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(()->offers.save(null,config("PROMOTION",LocalDate.now(),LocalDate.now().minusDays(1)))).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void hidesFutureOffersAndRejectsStaleEdits() {
        long id=offers.save(null,config("PROMOTION",LocalDate.now().plusDays(1),null));
        assertThat(sales.catalog().menus()).noneMatch(m->m.id()==id);
        var changed=config("PROMOTION",null,null);
        offers.save(id,changed);
        assertThat(sales.catalog().menus()).anyMatch(m->m.id()==id);
        assertThatThrownBy(()->offers.save(id,changed)).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Recarga");
    }
    @Test void rejectsIncompleteSelectionAndInsufficientStock() {
        long id=offers.save(null,config("PROMOTION",null,null));
        assertThatThrownBy(()->sales.createOrder(request(id,1,1))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(()->sales.createOrder(request(id,11,2))).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Stock insuficiente");
    }
    @Test void rejectsDuplicateNamesWithoutDatabaseError() {
        var draft=config("PROMOTION",null,null);
        long id=offers.save(null,draft);
        offers.save(id,draft); // Editar el mismo nombre no debe contarse como duplicado.
        assertThatThrownBy(()->offers.save(null,draft)).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Ya existe");
    }
    @Test void rejectsEmptyProductsAndAllOptionalGroups() {
        var empty=new Configuration("Vacía","","PROMOTION",100,null,null,true,0,List.of());
        assertThatThrownBy(()->offers.save(null,empty)).isInstanceOf(IllegalArgumentException.class);
        var optional=new Configuration("Opcional","","PROMOTION",100,null,null,true,0,
            List.of(new Section(category,"Completos",0,1,List.of(new Option(product,0)))));
        assertThatThrownBy(()->offers.save(null,optional)).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("obligatorio");
    }
    @Test void adminOnlyManagementAndValidatedHttpContract() throws Exception {
        var mvc=MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        mvc.perform(get("/api/menu-configurations")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/menu-configurations").with(user("cashier").roles("CASHIER"))).andExpect(status().isForbidden());
        mvc.perform(post("/api/menu-configurations").with(user("cashier").roles("CASHIER")).contentType("application/json").content("{}")).andExpect(status().isForbidden());
        mvc.perform(get("/api/menu-configurations").with(user("admin").roles("ADMIN"))).andExpect(status().isOk());
        mvc.perform(post("/api/menu-configurations").with(user("admin").roles("ADMIN")).contentType("application/json").content("{}")).andExpect(status().isBadRequest());
    }
}
