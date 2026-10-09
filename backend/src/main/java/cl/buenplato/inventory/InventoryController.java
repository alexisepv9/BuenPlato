/** API REST para materias primas y recetas asociadas a platos vendibles. */
package cl.buenplato.inventory;

import cl.buenplato.inventory.InventoryDtos.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class InventoryController {
    private final InventoryService inventory;

    public InventoryController(InventoryService inventory) { this.inventory = inventory; }

    @GetMapping("/ingredients")
    List<IngredientResponse> ingredients(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status
    ) { return inventory.listIngredients(search, status); }

    @PostMapping("/ingredients")
    @ResponseStatus(HttpStatus.CREATED)
    IngredientResponse createIngredient(@Valid @RequestBody IngredientRequest request) {
        return inventory.createIngredient(request);
    }

    @PutMapping("/ingredients/{id}")
    IngredientResponse updateIngredient(@PathVariable long id, @Valid @RequestBody IngredientRequest request) {
        return inventory.updateIngredient(id, request);
    }

    @DeleteMapping("/ingredients/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteIngredient(@PathVariable long id) { inventory.deleteIngredient(id); }

    @GetMapping("/recipes")
    List<RecipeResponse> recipes() { return inventory.listRecipes(); }

    @PutMapping("/products/{productId}/recipe")
    RecipeResponse saveRecipe(@PathVariable long productId, @Valid @RequestBody RecipeRequest request) {
        return inventory.saveRecipe(productId, request);
    }
}
