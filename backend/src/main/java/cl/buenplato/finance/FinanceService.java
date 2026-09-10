/**
 * Calcula rentabilidad, costos, punto de equilibrio y análisis sobre datos reales.
 */
package cl.buenplato.finance;

import cl.buenplato.finance.FinanceDtos.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class FinanceService {
    private final JdbcTemplate jdbc;

    public FinanceService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public DashboardResponse dashboard(LocalDate requestedFrom, LocalDate requestedTo) {
        LocalDate to = requestedTo == null ? LocalDate.now() : requestedTo;
        LocalDate from = requestedFrom == null ? to.minusDays(29) : requestedFrom;
        if (from.isAfter(to) || ChronoUnit.DAYS.between(from, to) > 365) {
            throw new IllegalArgumentException("El rango financiero debe contener entre 1 y 366 días.");
        }

        long revenue = orderMetric("COALESCE(SUM(total), 0)", from, to);
        long orders = orderMetric("COUNT(*)", from, to);
        long unitsSold = itemMetric("COALESCE(SUM(oi.quantity), 0)", from, to);
        long foodCost = itemMetric("COALESCE(SUM(oi.total_cost), 0)", from, to);
        long expenses = expenseMetric("COALESCE(SUM(amount), 0)", from, to, null);
        long fixedExpenses = expenseMetric("COALESCE(SUM(amount), 0)", from, to, "FIXED");
        long grossProfit = revenue - foodCost;
        long operatingResult = grossProfit - expenses;
        double foodCostPercentage = percentage(foodCost, revenue);
        double grossMarginPercentage = percentage(grossProfit, revenue);
        long breakEvenSales = grossMarginPercentage <= 0 ? 0
                : Math.round(fixedExpenses / (grossMarginPercentage / 100.0));

        long inventoryValue = jdbc.queryForObject(
                "SELECT COALESCE(SUM(stock * unit_cost), 0) FROM products WHERE active = TRUE AND track_stock = TRUE",
                Long.class
        );
        long wasteCost = jdbc.queryForObject("""
                SELECT COALESCE(SUM(ABS(im.quantity) * p.unit_cost), 0)
                FROM inventory_movements im
                JOIN products p ON p.id = im.product_id
                WHERE im.movement_type IN ('WASTE', 'LOSS')
                  AND CAST(im.created_at AS DATE) BETWEEN ? AND ?
                """, Long.class, Date.valueOf(from), Date.valueOf(to));

        long days = ChronoUnit.DAYS.between(from, to) + 1;
        LocalDate previousTo = from.minusDays(1);
        LocalDate previousFrom = previousTo.minusDays(days - 1);
        long previousRevenue = orderMetric("COALESCE(SUM(total), 0)", previousFrom, previousTo);
        long previousOrders = orderMetric("COUNT(*)", previousFrom, previousTo);

        Metrics metrics = new Metrics(
                revenue,
                orders,
                orders == 0 ? 0 : revenue / orders,
                unitsSold,
                foodCost,
                foodCostPercentage,
                grossProfit,
                grossMarginPercentage,
                expenses,
                operatingResult,
                fixedExpenses,
                breakEvenSales,
                inventoryValue,
                wasteCost,
                change(revenue, previousRevenue),
                change(orders, previousOrders)
        );

        List<DailySale> daily = jdbc.query("""
                SELECT CAST(created_at AS DATE) sale_date, SUM(total) revenue, COUNT(*) orders_count
                FROM orders
                WHERE status <> 'CANCELLED' AND CAST(created_at AS DATE) BETWEEN ? AND ?
                GROUP BY CAST(created_at AS DATE)
                ORDER BY sale_date
                """, (rs, row) -> new DailySale(
                rs.getDate("sale_date").toLocalDate(),
                rs.getLong("revenue"),
                rs.getLong("orders_count")
        ), Date.valueOf(from), Date.valueOf(to));

        List<Breakdown> paymentMethods = breakdown("""
                SELECT COALESCE(payment_method, 'SIN INFORMAR') label, SUM(total) amount
                FROM orders
                WHERE status <> 'CANCELLED' AND CAST(created_at AS DATE) BETWEEN ? AND ?
                GROUP BY payment_method
                ORDER BY amount DESC
                """, from, to, revenue);

        List<Breakdown> categories = breakdown("""
                SELECT CASE WHEN oi.item_type = 'MENU' THEN 'Menús buffet'
                            ELSE COALESCE(c.name, 'Otros') END label,
                       SUM(oi.total_price) amount
                FROM order_items oi
                JOIN orders o ON o.id = oi.order_id
                LEFT JOIN products p ON p.id = oi.product_id
                LEFT JOIN categories c ON c.id = p.category_id
                WHERE o.status <> 'CANCELLED' AND CAST(o.created_at AS DATE) BETWEEN ? AND ?
                GROUP BY CASE WHEN oi.item_type = 'MENU' THEN 'Menús buffet'
                              ELSE COALESCE(c.name, 'Otros') END
                ORDER BY amount DESC
                """, from, to, revenue);

        List<TopItem> topItems = jdbc.query("""
                SELECT oi.item_name, SUM(oi.quantity) quantity, SUM(oi.total_price) revenue,
                       SUM(oi.total_cost) cost
                FROM order_items oi
                JOIN orders o ON o.id = oi.order_id
                WHERE o.status <> 'CANCELLED' AND CAST(o.created_at AS DATE) BETWEEN ? AND ?
                GROUP BY oi.item_name
                ORDER BY revenue DESC
                FETCH FIRST 10 ROWS ONLY
                """, (rs, row) -> new TopItem(
                rs.getString("item_name"),
                rs.getLong("quantity"),
                rs.getLong("revenue"),
                rs.getLong("cost"),
                rs.getLong("revenue") - rs.getLong("cost")
        ), Date.valueOf(from), Date.valueOf(to));

        List<HourlySale> hourlySales = jdbc.query("""
                SELECT EXTRACT(HOUR FROM created_at) sale_hour, SUM(total) revenue, COUNT(*) orders_count
                FROM orders
                WHERE status <> 'CANCELLED' AND CAST(created_at AS DATE) BETWEEN ? AND ?
                GROUP BY EXTRACT(HOUR FROM created_at)
                ORDER BY sale_hour
                """, (rs, row) -> new HourlySale(
                rs.getInt("sale_hour"),
                rs.getLong("revenue"),
                rs.getLong("orders_count")
        ), Date.valueOf(from), Date.valueOf(to));

        List<ExpenseRow> expenseRows = expenses(from, to);
        List<StockRisk> stockRisks = jdbc.query("""
                SELECT id, sku, name, stock, low_stock_threshold, stock * unit_cost inventory_value
                FROM products
                WHERE active = TRUE AND track_stock = TRUE AND stock <= low_stock_threshold
                ORDER BY stock ASC, name
                """, (rs, row) -> new StockRisk(
                rs.getLong("id"),
                rs.getString("sku"),
                rs.getString("name"),
                rs.getDouble("stock"),
                rs.getDouble("low_stock_threshold"),
                rs.getLong("inventory_value")
        ));

        return new DashboardResponse(
                from, to, metrics, daily, paymentMethods, categories, topItems,
                hourlySales, expenseRows, stockRisks, insights(metrics, topItems, hourlySales, stockRisks)
        );
    }

    public List<ExpenseRow> expenses(LocalDate from, LocalDate to) {
        return jdbc.query("""
                SELECT id, expense_date, category, description, expense_type, amount, payment_method
                FROM expenses
                WHERE expense_date BETWEEN ? AND ?
                ORDER BY expense_date DESC, id DESC
                """, (rs, row) -> new ExpenseRow(
                rs.getLong("id"),
                rs.getDate("expense_date").toLocalDate(),
                rs.getString("category"),
                rs.getString("description"),
                rs.getString("expense_type"),
                rs.getLong("amount"),
                rs.getString("payment_method")
        ), Date.valueOf(from), Date.valueOf(to));
    }

    @Transactional
    public ExpenseRow createExpense(ExpenseRequest request, String email) {
        String type = request.type().trim().toUpperCase(Locale.ROOT);
        if (!List.of("FIXED", "VARIABLE").contains(type)) {
            throw new IllegalArgumentException("El gasto debe ser FIXED o VARIABLE.");
        }
        Long userId = jdbc.query("""
                        SELECT id FROM app_users WHERE LOWER(email) = LOWER(?) AND active = TRUE
                        """, rs -> rs.next() ? rs.getLong("id") : null, email);
        jdbc.update("""
                INSERT INTO expenses (
                    expense_date, category, description, expense_type, amount,
                    payment_method, created_by, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                """,
                Date.valueOf(request.date()),
                request.category().trim(),
                request.description().trim(),
                type,
                request.amount(),
                request.paymentMethod() == null ? null : request.paymentMethod().trim().toUpperCase(Locale.ROOT),
                userId
        );
        return jdbc.query("""
                        SELECT id, expense_date, category, description, expense_type, amount, payment_method
                        FROM expenses ORDER BY id DESC FETCH FIRST 1 ROW ONLY
                        """, rs -> {
                    rs.next();
                    return new ExpenseRow(
                            rs.getLong("id"), rs.getDate("expense_date").toLocalDate(),
                            rs.getString("category"), rs.getString("description"),
                            rs.getString("expense_type"), rs.getLong("amount"),
                            rs.getString("payment_method")
                    );
                });
    }

    private long orderMetric(String expression, LocalDate from, LocalDate to) {
        return jdbc.queryForObject(
                "SELECT " + expression + " FROM orders WHERE status <> 'CANCELLED' AND CAST(created_at AS DATE) BETWEEN ? AND ?",
                Long.class, Date.valueOf(from), Date.valueOf(to)
        );
    }

    private long itemMetric(String expression, LocalDate from, LocalDate to) {
        return jdbc.queryForObject(
                "SELECT " + expression + " FROM order_items oi JOIN orders o ON o.id = oi.order_id "
                        + "WHERE o.status <> 'CANCELLED' AND CAST(o.created_at AS DATE) BETWEEN ? AND ?",
                Long.class, Date.valueOf(from), Date.valueOf(to)
        );
    }

    private long expenseMetric(String expression, LocalDate from, LocalDate to, String type) {
        if (type == null) {
            return jdbc.queryForObject(
                    "SELECT " + expression + " FROM expenses WHERE expense_date BETWEEN ? AND ?",
                    Long.class, Date.valueOf(from), Date.valueOf(to)
            );
        }
        return jdbc.queryForObject(
                "SELECT " + expression + " FROM expenses WHERE expense_date BETWEEN ? AND ? AND expense_type = ?",
                Long.class, Date.valueOf(from), Date.valueOf(to), type
        );
    }

    private List<Breakdown> breakdown(String sql, LocalDate from, LocalDate to, long total) {
        return jdbc.query(sql, (rs, row) -> new Breakdown(
                rs.getString("label"),
                rs.getLong("amount"),
                percentage(rs.getLong("amount"), total)
        ), Date.valueOf(from), Date.valueOf(to));
    }

    private List<String> insights(
            Metrics metrics,
            List<TopItem> topItems,
            List<HourlySale> hours,
            List<StockRisk> stockRisks
    ) {
        List<String> insights = new ArrayList<>();
        if (metrics.orders() == 0) {
            insights.add("Aún no hay ventas en el período; registra pedidos para activar el análisis.");
            return insights;
        }
        insights.add(metrics.revenueChangePercentage() >= 0
                ? "Los ingresos crecieron %.1f%% frente al período anterior.".formatted(metrics.revenueChangePercentage())
                : "Los ingresos cayeron %.1f%% frente al período anterior; revisa volumen, horario y ticket.".formatted(Math.abs(metrics.revenueChangePercentage())));
        if (metrics.foodCostPercentage() > 40) {
            insights.add("El costo de alimentos supera 40% de las ventas; revisa porciones, compras y precios.");
        } else {
            insights.add("El costo de alimentos representa %.1f%% de las ventas.".formatted(metrics.foodCostPercentage()));
        }
        if (!topItems.isEmpty()) {
            insights.add("%s lidera los ingresos con un aporte de $%,d.".formatted(
                    topItems.getFirst().name(), topItems.getFirst().contribution()));
        }
        if (!hours.isEmpty()) {
            HourlySale peak = hours.stream().max((a, b) -> Long.compare(a.revenue(), b.revenue())).orElseThrow();
            insights.add("La hora de mayor venta es alrededor de las %02d:00; concentra preparación y personal antes de ese tramo.".formatted(peak.hour()));
        }
        if (!stockRisks.isEmpty()) {
            insights.add("%d productos están bajo su umbral de stock y podrían limitar ventas.".formatted(stockRisks.size()));
        }
        if (metrics.breakEvenSales() > 0) {
            insights.add("Con el margen observado, se requieren aproximadamente $%,d en ventas para cubrir los gastos fijos del período.".formatted(metrics.breakEvenSales()));
        }
        return insights;
    }

    private double percentage(long value, long total) {
        return total == 0 ? 0 : Math.round(value * 1000.0 / total) / 10.0;
    }

    private double change(long current, long previous) {
        if (previous == 0) return current == 0 ? 0 : 100;
        return Math.round((current - previous) * 1000.0 / previous) / 10.0;
    }
}
