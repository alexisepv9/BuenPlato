/**
 * Contratos de métricas, series, alertas y gastos del módulo financiero.
 */
package cl.buenplato.finance;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public final class FinanceDtos {
    private FinanceDtos() {}

    public record DashboardResponse(
            LocalDate from,
            LocalDate to,
            Metrics metrics,
            List<DailySale> dailySales,
            List<Breakdown> paymentMethods,
            List<Breakdown> categories,
            List<TopItem> topItems,
            List<HourlySale> hourlySales,
            List<ExpenseRow> expenses,
            List<StockRisk> stockRisks,
            List<String> insights
    ) {}

    public record Metrics(
            long revenue,
            long orders,
            long averageTicket,
            long unitsSold,
            long foodCost,
            double foodCostPercentage,
            long grossProfit,
            double grossMarginPercentage,
            long operatingExpenses,
            long operatingResult,
            long fixedExpenses,
            long breakEvenSales,
            long inventoryValue,
            long wasteCost,
            double revenueChangePercentage,
            double ordersChangePercentage
    ) {}

    public record DailySale(LocalDate date, long revenue, long orders) {}
    public record Breakdown(String label, long amount, double percentage) {}
    public record TopItem(String name, long quantity, long revenue, long cost, long contribution) {}
    public record HourlySale(int hour, long revenue, long orders) {}
    public record StockRisk(long productId, String sku, String name, double stock, double threshold, long inventoryValue) {}
    public record ExpenseRow(long id, LocalDate date, String category, String description, String type, long amount, String paymentMethod) {}

    public record ExpenseRequest(
            @NotNull LocalDate date,
            @NotBlank @Size(max = 60) String category,
            @NotBlank @Size(max = 200) String description,
            @NotBlank @Size(max = 20) String type,
            @Positive long amount,
            @Size(max = 30) String paymentMethod
    ) {}
}
