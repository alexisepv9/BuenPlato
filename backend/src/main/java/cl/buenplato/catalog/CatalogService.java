/**
 * Reglas de negocio del catálogo, búsqueda y administración de existencias.
 */
package cl.buenplato.catalog;

import cl.buenplato.catalog.CatalogDtos.*;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class CatalogService {
    private final CategoryRepository categories;
    private final ProductRepository products;

    public CatalogService(CategoryRepository categories, ProductRepository products) {
        this.categories = categories;
        this.products = products;
    }

    public List<CategoryResponse> listCategories() {
        return categories.findByActiveTrueOrderByDisplayOrderAscNameAsc()
                .stream().map(CategoryResponse::from).toList();
    }

    public PageResponse<ProductResponse> listProducts(
            String search,
            String category,
            String status,
            int page,
            int size
    ) {
        Specification<Product> spec = (root, query, cb) -> cb.isTrue(root.get("active"));

        if (search != null && !search.isBlank()) {
            String term = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("name")), term)
            ));
        }
        if (category != null && !category.isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.join("category", JoinType.INNER).get("slug"), category));
        }
        if ("LOW_STOCK".equals(status)) {
            spec = spec.and((root, query, cb) -> cb.and(
                    cb.isTrue(root.get("trackStock")),
                    cb.greaterThan(root.get("stock"), java.math.BigDecimal.ZERO),
                    cb.lessThanOrEqualTo(root.get("stock"), root.get("lowStockThreshold"))
            ));
        } else if ("OUT_OF_STOCK".equals(status)) {
            spec = spec.and((root, query, cb) -> cb.and(
                    cb.isTrue(root.get("trackStock")),
                    cb.equal(root.get("stock"), java.math.BigDecimal.ZERO)
            ));
        }

        Page<Product> result = products.findAll(
                spec,
                PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100), Sort.by("name").ascending())
        );
        return new PageResponse<>(
                result.getContent().stream().map(ProductResponse::from).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages()
        );
    }

    @Transactional
    public ProductResponse createProduct(ProductCreateRequest request) {
        // Código interno automático; no requiere intervención del usuario.
        Category category = categories.findById(request.categoryId())
                .filter(Category::isActive)
                .orElseThrow(() -> new IllegalArgumentException("La categoría seleccionada no existe."));

        Product product = new Product(
                category,
                request.name().trim(),
                request.description() == null ? "" : request.description().trim(),
                request.price(),
                request.unit().trim(),
                request.stock(),
                request.lowStockThreshold(),
                request.trackStock()
        );
        return ProductResponse.from(products.save(product));
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductUpdateRequest request) {
        Product product = activeProduct(id);
        Category category = categories.findById(request.categoryId())
                .filter(Category::isActive)
                .orElseThrow(() -> new IllegalArgumentException("La categoría seleccionada no existe."));

        product.update(
                category,
                request.name().trim(),
                request.description() == null ? "" : request.description().trim(),
                request.price(),
                request.unit().trim(),
                request.stock(),
                request.lowStockThreshold(),
                request.trackStock()
        );
        return ProductResponse.from(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        activeProduct(id).deactivate();
    }

    private Product activeProduct(Long id) {
        return products.findById(id)
                .filter(Product::isActive)
                .orElseThrow(() -> new IllegalArgumentException("El producto no existe o ya fue eliminado."));
    }
}
