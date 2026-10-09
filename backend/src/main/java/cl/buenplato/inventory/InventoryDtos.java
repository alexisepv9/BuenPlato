/** Contratos del inventario de materias primas y recetas de platos. */
package cl.buenplato.inventory;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

public final class InventoryDtos {
    private InventoryDtos() {}

    public record IngredientRequest(
            @NotBlank @Size(max = 60) String sku,
            @NotBlank @Size(max = 120) String name,
            @NotBlank String unit,
            @NotNull @PositiveOrZero BigDecimal stock,
            @NotNull @PositiveOrZero BigDecimal lowStockThreshold,
            @NotNull @PositiveOrZero BigDecimal unitCost,
            @Size(max = 2048) @Pattern(regexp = "^(https://[^\\s]+)?$", message = "La imagen debe ser un enlace HTTPS.") String imageUrl
    ) {}

    public record IngredientResponse(
            long id, String sku, String name, String baseUnit, BigDecimal stock,
            BigDecimal lowStockThreshold, BigDecimal unitCost, String stockStatus, String imageUrl
    ) {}

    public record RecipeComponentRequest(
            @NotNull Long ingredientId,
            @NotNull @Positive BigDecimal quantity,
            @NotBlank String unit
    ) {}

    public record RecipeRequest(
            @NotBlank @Size(max = 120) String productName,
            @NotNull @Positive BigDecimal yieldQuantity,
            @NotEmpty List<@Valid RecipeComponentRequest> ingredients
    ) {}

    public record RecipeComponentResponse(
            long ingredientId, String ingredientName, BigDecimal quantity, String baseUnit
    ) {}

    public record RecipeResponse(
            long id, long productId, String productName, BigDecimal yieldQuantity,
            BigDecimal costPerPortion, List<RecipeComponentResponse> ingredients
    ) {}
}
