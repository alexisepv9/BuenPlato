package cl.buenplato.shared;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Alertas derivadas de datos reales; el servidor limita su contenido según el usuario. */
@RestController
public class NotificationController {
    private final JdbcTemplate jdbc;
    public NotificationController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    /** Administración ve stock y ventas; caja solo recibe ventas registradas por su cuenta. */
    @GetMapping("/api/notifications")
    public List<Map<String, Object>> notifications(Authentication auth) {
        boolean admin = auth.getAuthorities().stream().anyMatch(role -> role.getAuthority().equals("ROLE_ADMIN"));
        boolean cashier = auth.getAuthorities().stream().anyMatch(role -> role.getAuthority().equals("ROLE_CASHIER"));
        List<Map<String, Object>> result = new ArrayList<>();
        if (!admin && !cashier) return result;
        if (admin) {
            result.addAll(jdbc.query("SELECT id,name,stock,base_unit FROM ingredients WHERE active=TRUE AND stock<=low_stock_threshold ORDER BY stock,id LIMIT 50",
                (rs, n) -> Map.<String,Object>of("id", "ingredient-" + rs.getLong("id") + "-" + rs.getBigDecimal("stock"),
                    "title", rs.getBigDecimal("stock").signum() == 0 ? "Materia prima agotada" : "Stock bajo",
                    "message", rs.getString("name") + ": " + rs.getBigDecimal("stock").stripTrailingZeros().toPlainString() + " " + rs.getString("base_unit"))));
            result.addAll(jdbc.query("SELECT p.id,p.name,p.stock FROM products p JOIN categories c ON c.id=p.category_id WHERE p.active=TRUE AND p.track_stock=TRUE AND c.slug='bebestibles' AND p.stock<=p.low_stock_threshold ORDER BY p.stock,p.id LIMIT 50",
                (rs, n) -> Map.<String,Object>of("id", "product-" + rs.getLong("id") + "-" + rs.getBigDecimal("stock"), "title", "Bebida con stock bajo",
                    "message", rs.getString("name") + ": " + rs.getBigDecimal("stock").stripTrailingZeros().toPlainString() + " unidades")));
        }
        result.addAll(jdbc.query("SELECT o.id,o.order_number,o.total,o.revision FROM orders o LEFT JOIN app_users u ON u.id=o.created_by WHERE (?=TRUE OR LOWER(u.email)=LOWER(?)) ORDER BY o.updated_at DESC LIMIT 20",
            (rs, n) -> Map.<String,Object>of("id", "sale-" + rs.getLong("id") + "-" + rs.getInt("revision"),
                "title", rs.getInt("revision") > 0 ? "Venta actualizada" : "Venta realizada",
                "message", rs.getString("order_number") + " · $" + rs.getInt("total")), admin, auth.getName()));
        return result;
    }
}
