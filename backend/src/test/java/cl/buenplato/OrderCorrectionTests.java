package cl.buenplato;

import cl.buenplato.sales.SalesDtos.*;
import cl.buenplato.sales.SalesService;
import cl.buenplato.shared.NotificationController;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import static org.assertj.core.api.Assertions.*;

/** Verifica rollback real fuera de una transacción de prueba y filtrado de alertas. */
@SpringBootTest
class OrderCorrectionTests {
    @Autowired JdbcTemplate jdbc;
    @Autowired SalesService sales;
    @Autowired NotificationController notifications;

    @Test
    void insufficientStockPreservesOriginalOrderAndAudit() {
        jdbc.update("INSERT INTO categories(name,slug,category_type) VALUES ('Bebidas QA','bebestibles','PRODUCT') ON CONFLICT DO NOTHING");
        Long category = jdbc.queryForObject("SELECT id FROM categories WHERE slug='bebestibles'", Long.class);
        jdbc.update("INSERT INTO products(category_id,sku,name,price,stock) VALUES (?,'QA-ROLLBACK-DRINK','Agua QA',1000,5)", category);
        Long product = jdbc.queryForObject("SELECT id FROM products WHERE sku='QA-ROLLBACK-DRINK'", Long.class);
        var original = sales.createOrder(new CreateOrderRequest(List.of(), List.of(new ExtraItem(product, 2)), null, "TAKEAWAY", "CASH", null));
        var impossible = new CreateOrderRequest(List.of(), List.of(new ExtraItem(product, 99)), null, "TAKEAWAY", "CASH", null);
        assertThatThrownBy(() -> sales.replaceOrder(original.id(), new ReplaceOrderRequest(impossible, 0), "qa"))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Stock insuficiente");
        assertThat(jdbc.queryForObject("SELECT stock FROM products WHERE id=?", BigDecimal.class, product)).isEqualByComparingTo("3");
        assertThat(jdbc.queryForObject("SELECT total FROM orders WHERE id=?", Integer.class, original.id())).isEqualTo(2000);
        assertThat(jdbc.queryForObject("SELECT revision FROM orders WHERE id=?", Integer.class, original.id())).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM order_revisions WHERE order_id=?", Integer.class, original.id())).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM inventory_movements WHERE order_id=?", Integer.class, original.id())).isEqualTo(1);
    }

    @Test
    void notificationContentsAreFilteredByRoleAndOwner() {
        var cashier = new UsernamePasswordAuthenticationToken("nobody@example.test", "", List.of(new SimpleGrantedAuthority("ROLE_CASHIER")));
        assertThat(notifications.notifications(cashier)).isEmpty();
        var other = new UsernamePasswordAuthenticationToken("nobody@example.test", "", List.of(new SimpleGrantedAuthority("ROLE_KITCHEN")));
        assertThat(notifications.notifications(other)).isEmpty();
    }
}
