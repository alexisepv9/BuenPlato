/** Ranking por unidades vendidas, incluyendo los productos contenidos en colaciones y promociones. */
package cl.buenplato.finance;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.sql.Date;
import java.time.LocalDate;
import java.util.*;
import cl.buenplato.finance.FinanceDtos.ProductDemand;

@Service
public class ProductDemandService {
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper = new ObjectMapper();

    public ProductDemandService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    /** Usa instantáneas históricas y excluye anulaciones; no cuenta la oferta como otro producto. */
    public List<ProductDemand> ranking(LocalDate from, LocalDate to) {
        Map<Long, ProductDemand> totals = new HashMap<>();
        jdbc.query("""
                SELECT oi.product_id, oi.item_name, oi.item_type, oi.quantity, oi.selections_json
                FROM order_items oi JOIN orders o ON o.id = oi.order_id
                WHERE o.status <> 'CANCELLED' AND CAST(o.created_at AS DATE) BETWEEN ? AND ?
                ORDER BY o.created_at, oi.id
                """, rs -> {
            long quantity = rs.getLong("quantity");
            if (!"MENU".equals(rs.getString("item_type"))) {
                long id = rs.getLong("product_id");
                if (!rs.wasNull()) add(totals, id, rs.getString("item_name"), quantity, 0);
            } else {
                String json = rs.getString("selections_json");
                if (json == null || json.isBlank()) return;
                try {
                    for (var selection : mapper.readTree(json)) {
                        if (!selection.hasNonNull("productId")) continue;
                        // totalQuantity ya incluye el multiplicador de la oferta: no multiplicarlo otra vez.
                        long units = selection.hasNonNull("totalQuantity")
                                ? selection.path("totalQuantity").asLong()
                                : selection.path("quantity").asLong() * quantity;
                        add(totals, selection.path("productId").asLong(), selection.path("name").asText(), 0, units);
                    }
                } catch (java.io.IOException exception) {
                    throw new IllegalStateException("No se pudo leer el detalle histórico para el ranking de productos", exception);
                }
            }
        }, Date.valueOf(from), Date.valueOf(to));
        return totals.values().stream()
                .sorted(Comparator.comparingLong(ProductDemand::quantity).reversed()
                        .thenComparing(ProductDemand::name).thenComparingLong(ProductDemand::productId))
                .limit(10).toList();
    }

    /** Agrupa por ID, no por nombre; conserva separado el origen de las unidades. */
    private void add(Map<Long, ProductDemand> totals, long id, String name, long direct, long offer) {
        ProductDemand previous = totals.getOrDefault(id, new ProductDemand(id, name, 0, 0, 0));
        totals.put(id, new ProductDemand(id, name, previous.directQuantity() + direct,
                previous.offerQuantity() + offer, previous.quantity() + direct + offer));
    }
}
