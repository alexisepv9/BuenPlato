/**
 * API REST de indicadores financieros, gastos y descargas de reportes.
 */
package cl.buenplato.finance;

import cl.buenplato.finance.FinanceDtos.DashboardResponse;
import cl.buenplato.finance.FinanceDtos.ExpenseRequest;
import cl.buenplato.finance.FinanceDtos.ExpenseRow;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/finance")
public class FinanceController {
    private final FinanceService finance;
    private final FinanceReportService reports;

    public FinanceController(FinanceService finance, FinanceReportService reports) {
        this.finance = finance;
        this.reports = reports;
    }

    @GetMapping("/dashboard")
    DashboardResponse dashboard(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return finance.dashboard(from, to);
    }

    @PostMapping("/expenses")
    ExpenseRow createExpense(@Valid @RequestBody ExpenseRequest request, Authentication authentication) {
        return finance.createExpense(request, authentication.getName());
    }

    @GetMapping("/reports/excel")
    ResponseEntity<byte[]> excel(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        DashboardResponse data = finance.dashboard(from, to);
        return download(
                reports.excel(data),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "buen-plato-finanzas-" + data.from() + "-" + data.to() + ".xlsx"
        );
    }

    @GetMapping("/reports/pdf")
    ResponseEntity<byte[]> pdf(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        DashboardResponse data = finance.dashboard(from, to);
        return download(
                reports.pdf(data),
                MediaType.APPLICATION_PDF_VALUE,
                "buen-plato-finanzas-" + data.from() + "-" + data.to() + ".pdf"
        );
    }

    private ResponseEntity<byte[]> download(byte[] content, String contentType, String filename) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(content);
    }
}
