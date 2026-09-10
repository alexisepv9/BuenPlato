/**
 * API REST para consultar categorías y crear, modificar o desactivar productos.
 */
package cl.buenplato.catalog;

import cl.buenplato.catalog.CatalogDtos.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class CatalogController {
    private final CatalogService catalog;

    public CatalogController(CatalogService catalog) {
        this.catalog = catalog;
    }

    @GetMapping("/categories")
    List<CategoryResponse> categories() {
        return catalog.listCategories();
    }

    @GetMapping("/products")
    PageResponse<ProductResponse> products(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return catalog.listProducts(search, category, status, page, size);
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    ProductResponse createProduct(@Valid @RequestBody ProductCreateRequest request) {
        return catalog.createProduct(request);
    }

    @PutMapping("/products/{id}")
    ProductResponse updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductUpdateRequest request
    ) {
        return catalog.updateProduct(id, request);
    }

    @DeleteMapping("/products/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteProduct(@PathVariable Long id) {
        catalog.deleteProduct(id);
    }
}
