package cl.buenplato.inventory;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

/** Catálogo independiente de categorías de insumos, protegido por ADMIN. */
@RestController
@RequestMapping("/api/ingredients/categories")
public class IngredientCategoryController {
    private final JdbcTemplate jdbc;
    public IngredientCategoryController(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    public record Category(long id, String name) {}
    public record Request(@NotBlank @Size(max=80) String name) {}
    @GetMapping
    public List<Category> list() {
        return jdbc.query("SELECT id,name FROM ingredient_categories WHERE active=TRUE ORDER BY name", (rs,n) -> new Category(rs.getLong(1),rs.getString(2)));
    }
    @PostMapping
    public List<Category> create(@Valid @RequestBody Request request) {
        String name = request.name().trim();
        if (jdbc.queryForObject("SELECT COUNT(*) FROM ingredient_categories WHERE LOWER(name)=LOWER(?)", Integer.class, name) > 0)
            throw new IllegalArgumentException("Ya existe una categoría con ese nombre.");
        jdbc.update("INSERT INTO ingredient_categories(name) VALUES (?)", name);
        return list();
    }

    /** Renombra sin cambiar el ID utilizado por los insumos. */
    @PutMapping("/{id}")
    @Transactional
    public List<Category> rename(@PathVariable long id, @Valid @RequestBody Request request) {
        lockActive(id);
        String name = request.name().trim();
        if (jdbc.queryForObject("SELECT COUNT(*) FROM ingredient_categories WHERE LOWER(name)=LOWER(?) AND id<>?", Integer.class, name, id) > 0)
            throw new IllegalArgumentException("Ya existe una categoría con ese nombre.");
        jdbc.update("UPDATE ingredient_categories SET name=? WHERE id=?", name, id);
        return list();
    }

    /** Si está en uso, exige un destino y reasigna todos los insumos de forma atómica. */
    @DeleteMapping("/{id}")
    @Transactional
    public List<Category> deactivate(@PathVariable long id, @RequestParam(required=false) Long replacementId) {
        lockActive(id);
        if (id == 1) throw new IllegalArgumentException("La categoría inicial se conserva para los registros sin clasificar.");
        int count = jdbc.queryForObject("SELECT COUNT(*) FROM ingredients WHERE category_id=?", Integer.class, id);
        if (count > 0) {
            if (replacementId == null || replacementId == id) throw new IllegalArgumentException("Selecciona otra categoría para reasignar los insumos antes de desactivar.");
            lockActive(replacementId);
            jdbc.update("UPDATE ingredients SET category_id=?,updated_at=CURRENT_TIMESTAMP WHERE category_id=?", replacementId,id);
        }
        jdbc.update("UPDATE ingredient_categories SET active=FALSE WHERE id=?", id);
        return list();
    }

    private void lockActive(long id) {
        var rows = jdbc.queryForList("SELECT id FROM ingredient_categories WHERE id=? AND active=TRUE FOR UPDATE", Long.class,id);
        if (rows.isEmpty()) throw new IllegalArgumentException("La categoría no está disponible.");
    }
}
