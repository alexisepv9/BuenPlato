/**
 * Genera representaciones descargables PDF y Excel del tablero financiero.
 */
package cl.buenplato.finance;

import cl.buenplato.finance.FinanceDtos.DashboardResponse;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.text.NumberFormat;
import java.util.Locale;

@Service
public class FinanceReportService {
    private static final NumberFormat CLP = NumberFormat.getCurrencyInstance(Locale.of("es", "CL"));

    public byte[] excel(DashboardResponse data) {
        try (var workbook = new XSSFWorkbook(); var output = new ByteArrayOutputStream()) {
            CellStyle header = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            header.setFont(headerFont);
            header.setFillForegroundColor(IndexedColors.LIGHT_ORANGE.getIndex());
            header.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            Sheet summary = workbook.createSheet("Resumen");
            row(summary, 0, header, "Indicador", "Valor");
            int index = 1;
            index = metric(summary, index, "Ventas", data.metrics().revenue());
            index = metric(summary, index, "Pedidos", data.metrics().orders());
            index = metric(summary, index, "Ticket promedio", data.metrics().averageTicket());
            index = metric(summary, index, "Costo de alimentos", data.metrics().foodCost());
            index = metric(summary, index, "Utilidad bruta", data.metrics().grossProfit());
            index = metric(summary, index, "Gastos operacionales", data.metrics().operatingExpenses());
            index = metric(summary, index, "Resultado operacional", data.metrics().operatingResult());
            index = metric(summary, index, "Punto de equilibrio", data.metrics().breakEvenSales());
            metric(summary, index, "Inventario valorizado", data.metrics().inventoryValue());
            summary.autoSizeColumn(0);
            summary.autoSizeColumn(1);

            Sheet daily = workbook.createSheet("Ventas diarias");
            row(daily, 0, header, "Fecha", "Ventas", "Pedidos");
            for (int i = 0; i < data.dailySales().size(); i++) {
                var value = data.dailySales().get(i);
                row(daily, i + 1, null, value.date().toString(), value.revenue(), value.orders());
            }

            Sheet products = workbook.createSheet("Productos");
            row(products, 0, header, "Producto", "Cantidad", "Ventas", "Costo", "Contribución");
            for (int i = 0; i < data.topItems().size(); i++) {
                var value = data.topItems().get(i);
                row(products, i + 1, null, value.name(), value.quantity(), value.revenue(), value.cost(), value.contribution());
            }

            Sheet expenses = workbook.createSheet("Gastos");
            row(expenses, 0, header, "Fecha", "Categoría", "Descripción", "Tipo", "Monto", "Medio de pago");
            for (int i = 0; i < data.expenses().size(); i++) {
                var value = data.expenses().get(i);
                row(expenses, i + 1, null, value.date().toString(), value.category(), value.description(), value.type(), value.amount(), value.paymentMethod());
            }
            for (Sheet sheet : workbook) {
                for (int column = 0; column < Math.min(sheet.getRow(0).getLastCellNum(), 8); column++) {
                    sheet.autoSizeColumn(column);
                }
            }
            workbook.write(output);
            return output.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("No fue posible generar el archivo Excel.", exception);
        }
    }

    public byte[] pdf(DashboardResponse data) {
        try (var output = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 40, 40);
            PdfWriter.getInstance(document, output);
            document.open();
            document.add(new Paragraph("Buen Plato - Informe financiero", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18)));
            document.add(new Paragraph("Período: " + data.from() + " al " + data.to(), FontFactory.getFont(FontFactory.HELVETICA, 10)));
            document.add(Chunk.NEWLINE);

            PdfPTable metrics = new PdfPTable(2);
            metrics.setWidthPercentage(100);
            pdfRow(metrics, "Ventas", money(data.metrics().revenue()));
            pdfRow(metrics, "Pedidos", String.valueOf(data.metrics().orders()));
            pdfRow(metrics, "Ticket promedio", money(data.metrics().averageTicket()));
            pdfRow(metrics, "Costo de alimentos", money(data.metrics().foodCost()) + " (" + data.metrics().foodCostPercentage() + "%)");
            pdfRow(metrics, "Utilidad bruta", money(data.metrics().grossProfit()) + " (" + data.metrics().grossMarginPercentage() + "%)");
            pdfRow(metrics, "Gastos operacionales", money(data.metrics().operatingExpenses()));
            pdfRow(metrics, "Resultado operacional", money(data.metrics().operatingResult()));
            pdfRow(metrics, "Punto de equilibrio", money(data.metrics().breakEvenSales()));
            document.add(metrics);

            document.add(new Paragraph("\nAnálisis ejecutivo", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13)));
            for (String insight : data.insights()) {
                document.add(new Paragraph("• " + insight, FontFactory.getFont(FontFactory.HELVETICA, 9)));
            }

            document.add(new Paragraph("\nProductos principales", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13)));
            PdfPTable products = new PdfPTable(new float[]{3, 1, 1.5f, 1.5f});
            products.setWidthPercentage(100);
            pdfRow(products, "Producto", "Cantidad", "Ventas", "Contribución");
            for (var item : data.topItems()) {
                pdfRow(products, item.name(), String.valueOf(item.quantity()), money(item.revenue()), money(item.contribution()));
            }
            document.add(products);
            document.close();
            return output.toByteArray();
        } catch (DocumentException | IOException exception) {
            throw new IllegalStateException("No fue posible generar el informe PDF.", exception);
        }
    }

    private int metric(Sheet sheet, int index, String label, long value) {
        row(sheet, index, null, label, value);
        return index + 1;
    }

    private void row(Sheet sheet, int index, CellStyle style, Object... values) {
        Row row = sheet.createRow(index);
        for (int column = 0; column < values.length; column++) {
            Cell cell = row.createCell(column);
            if (style != null) cell.setCellStyle(style);
            Object value = values[column];
            if (value instanceof Number number) cell.setCellValue(number.doubleValue());
            else cell.setCellValue(value == null ? "" : value.toString());
        }
    }

    private void pdfRow(PdfPTable table, String... values) {
        for (String value : values) table.addCell(new Phrase(value, FontFactory.getFont(FontFactory.HELVETICA, 8)));
    }

    private String money(long value) {
        return CLP.format(value);
    }
}
