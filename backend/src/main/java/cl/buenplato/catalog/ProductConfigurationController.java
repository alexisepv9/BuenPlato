package cl.buenplato.catalog;

import cl.buenplato.inventory.InventoryDtos.*;
import cl.buenplato.inventory.InventoryService;
import jakarta.persistence.EntityManager;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/** Guarda producto y composición juntos; no deduce su funcionamiento desde la categoría. */
@RestController
@RequestMapping("/api/products/configuration")
public class ProductConfigurationController {
    private final CatalogService catalog;
    private final InventoryService inventory;
    private final EntityManager entities;
    public ProductConfigurationController(CatalogService catalog, InventoryService inventory, EntityManager entities) {
        this.catalog = catalog; this.inventory = inventory; this.entities = entities;
    }
    public enum Mode { PRODUCT, COMPOSITION, NONE }
    public record Configuration(@NotNull @Valid CatalogDtos.ProductCreateRequest product,
            @NotNull Mode mode, @NotNull @Positive BigDecimal yieldQuantity,
            @NotNull List<@Valid RecipeComponentRequest> ingredients) {}

    /** Alta atómica: si falla la composición, tampoco se crea el producto. */
    @PostMapping
    @Transactional
    public CatalogDtos.ProductResponse create(@Valid @RequestBody Configuration request) {
        validate(request);
        var p = request.product();
        var result = catalog.createProduct(new CatalogDtos.ProductCreateRequest(p.categoryId(),p.name(),p.description(),p.price(),p.unit(),p.stock(),p.lowStockThreshold(),request.mode()!=Mode.NONE));
        entities.flush();
        configure(result.id(),request);
        return result;
    }

    /** Edición atómica con la misma estructura que el alta. */
    @PutMapping("/{id}")
    @Transactional
    public CatalogDtos.ProductResponse update(@PathVariable long id,@Valid @RequestBody Configuration request) {
        validate(request);
        var p = request.product();
        var result = catalog.updateProduct(id,new CatalogDtos.ProductUpdateRequest(p.categoryId(),p.name(),p.description(),p.price(),p.unit(),p.stock(),p.lowStockThreshold(),request.mode()!=Mode.NONE));
        entities.flush();
        configure(id,request);
        return result;
    }

    private void validate(Configuration request) {
        if (request.mode()==Mode.COMPOSITION && request.ingredients().isEmpty())
            throw new IllegalArgumentException("Agrega al menos un insumo a la composición.");
    }

    /** Desactiva la composición al elegir existencias o sin control, conservando el historial. */
    private void configure(long id, Configuration request) {
        inventory.saveRecipe(id,new RecipeRequest(request.product().name(),request.yieldQuantity(),
                request.mode()==Mode.COMPOSITION ? request.ingredients() : List.of()));
    }
}
