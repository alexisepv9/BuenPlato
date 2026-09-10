/**
 * Contratos del catálogo de venta, composición de menús y pedidos registrados.
 */
package cl.buenplato.sales;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class SalesDtos {
    private SalesDtos() {}

    public record ProductSaleResponse(
            Long id,
            String name,
            String description,
            int price,
            String category,
            String categorySlug,
            double stock
    ) {}

    public record MenuOptionResponse(
            Long id,
            Long productId,
            String name,
            String description,
            int price,
            int extraPrice,
            double stock
    ) {}

    public record MenuSectionResponse(
            Long id,
            String label,
            String categorySlug,
            int minimumSelections,
            int maximumSelections,
            boolean required,
            List<MenuOptionResponse> options
    ) {}

    public record MenuResponse(
            Long id,
            String name,
            String description,
            int basePrice,
            List<MenuSectionResponse> sections
    ) {}

    public record SalesCatalogResponse(
            List<MenuResponse> menus,
            List<ProductSaleResponse> additionalProducts
    ) {}

    public record OptionQuantity(
            Long optionId,
            @Min(1) int quantity
    ) {}

    public record SectionSelection(
            Long sectionId,
            List<@Valid OptionQuantity> options
    ) {}

    public record ExtraItem(
            Long productId,
            @Min(1) int quantity
    ) {}

    public record MenuItemRequest(
            Long menuId,
            @Min(1) int quantity,
            List<@Valid SectionSelection> selections
    ) {}

    public record CreateOrderRequest(
            List<@Valid MenuItemRequest> menus,
            List<@Valid ExtraItem> extras,
            @Size(max = 120) String customerName,
            @Size(max = 30) String serviceType,
            @Size(max = 30) String paymentMethod,
            @Size(max = 500) String notes
    ) {}

    public record OrderResponse(
            Long id,
            String orderNumber,
            String status,
            String paymentStatus,
            int subtotal,
            int total,
            String createdAt
    ) {}

    public record OrderHistoryResponse(
            Long id,
            String orderNumber,
            String customerName,
            String serviceType,
            String status,
            String paymentMethod,
            String paymentStatus,
            int total,
            String notes,
            String createdAt,
            List<OrderHistoryItem> items
    ) {}

    public record OrderHistoryItem(
            String itemType,
            String itemName,
            int quantity,
            int unitPrice,
            int totalPrice
    ) {}

    public record UpdateOrderRequest(
            @Size(max = 120) String customerName,
            @NotBlank @Size(max = 30) String serviceType,
            @NotBlank @Size(max = 30) String status,
            @NotBlank @Size(max = 30) String paymentMethod,
            @Size(max = 500) String notes
    ) {}
}
