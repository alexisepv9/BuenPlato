/**
 * Contratos de entrada y salida del módulo de catálogo e inventario.
 */
package cl.buenplato.catalog;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

public final class CatalogDtos {
    private CatalogDtos() {}

    public record CategoryResponse(Long id, String name, String slug, String categoryType) {
        static CategoryResponse from(Category category) {
            return new CategoryResponse(
                    category.getId(),
                    category.getName(),
                    category.getSlug(),
                    category.getCategoryType()
            );
        }
    }

    public record ProductCreateRequest(
            @NotNull Long categoryId,
            @NotBlank @Size(max = 60) String sku,
            @NotBlank @Size(max = 120) String name,
            @Size(max = 500) String description,
            @PositiveOrZero int price,
            @NotBlank @Size(max = 30) String unit,
            @NotNull @PositiveOrZero BigDecimal stock,
            @NotNull @PositiveOrZero BigDecimal lowStockThreshold,
            boolean trackStock
    ) {}

    public record ProductUpdateRequest(
            @NotNull Long categoryId,
            @NotBlank @Size(max = 60) String sku,
            @NotBlank @Size(max = 120) String name,
            @Size(max = 500) String description,
            @PositiveOrZero int price,
            @NotBlank @Size(max = 30) String unit,
            @NotNull @PositiveOrZero BigDecimal stock,
            @NotNull @PositiveOrZero BigDecimal lowStockThreshold,
            boolean trackStock
    ) {}

    public record ProductResponse(
            Long id,
            String sku,
            String name,
            String description,
            int price,
            String unit,
            BigDecimal stock,
            BigDecimal lowStockThreshold,
            boolean trackStock,
            boolean active,
            String stockStatus,
            CategoryResponse category
    ) {
        static ProductResponse from(Product product) {
            String status = !product.isTrackStock() ? "UNTRACKED"
                    : product.getStock().signum() == 0 ? "OUT_OF_STOCK"
                    : product.getStock().compareTo(product.getLowStockThreshold()) <= 0 ? "LOW_STOCK"
                    : "NORMAL";
            return new ProductResponse(
                    product.getId(),
                    product.getSku(),
                    product.getName(),
                    product.getDescription(),
                    product.getPrice(),
                    product.getUnit(),
                    product.getStock(),
                    product.getLowStockThreshold(),
                    product.isTrackStock(),
                    product.isActive(),
                    status,
                    CategoryResponse.from(product.getCategory())
            );
        }
    }

    public record PageResponse<T>(
            List<T> content,
            int page,
            int size,
            long totalElements,
            int totalPages
    ) {}
}
