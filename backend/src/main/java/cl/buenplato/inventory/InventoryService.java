/** Reglas transaccionales de materias primas, conversiones de unidad y recetas. */
package cl.buenplato.inventory;

import cl.buenplato.inventory.InventoryDtos.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.PreparedStatement;
import java.util.*;

@Service
public class InventoryService {
    private final JdbcTemplate jdbc;

    public InventoryService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Transactional(readOnly = true)
    public List<IngredientResponse> listIngredients(String search, String status) {
        String term = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        return jdbc.query("""
                SELECT id, name, base_unit, stock, low_stock_threshold, unit_cost, image_url, category_id
                FROM ingredients WHERE active = TRUE
                  AND (? = '' OR LOWER(name) LIKE ?)
                ORDER BY name
                """, (rs, row) -> ingredient(
                rs.getLong("id"), rs.getString("name"),
                rs.getString("base_unit"), rs.getBigDecimal("stock"),
                rs.getBigDecimal("low_stock_threshold"), rs.getBigDecimal("unit_cost"), rs.getString("image_url"), rs.getLong("category_id")
        ), term, "%" + term + "%").stream()
                .filter(item -> status == null || status.isBlank() || item.stockStatus().equals(status))
                .toList();
    }

    @Transactional
    public IngredientResponse createIngredient(IngredientRequest request) {
        requireCategory(request.categoryId());
        UnitValue stock = normalize(request.stock(), request.unit());
        UnitValue threshold = normalize(request.lowStockThreshold(), request.unit());
        BigDecimal baseCost = normalizeCost(request.unitCost(), request.unit());
        var key = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            var statement = connection.prepareStatement("""
                    INSERT INTO ingredients (name, base_unit, stock, low_stock_threshold, unit_cost, image_url, category_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, new String[]{"id"});
            statement.setString(1, request.name().trim());
            statement.setString(2, stock.baseUnit());
            statement.setBigDecimal(3, stock.quantity());
            statement.setBigDecimal(4, threshold.quantity());
            statement.setBigDecimal(5, baseCost);
            statement.setString(6, request.imageUrl());
            statement.setLong(7, request.categoryId());
            return statement;
        }, key);
        return findIngredient(Objects.requireNonNull(key.getKey()).longValue());
    }

    @Transactional
    public IngredientResponse updateIngredient(long id, IngredientRequest request) {
        IngredientResponse current = findIngredient(id);
        requireCategory(request.categoryId());
        UnitValue stock = normalize(request.stock(), request.unit());
        UnitValue threshold = normalize(request.lowStockThreshold(), request.unit());
        if (!current.baseUnit().equals(stock.baseUnit())) {
            throw new IllegalArgumentException("No se puede cambiar entre unidades de peso, volumen y unidad.");
        }
        jdbc.update("""
                UPDATE ingredients SET name=?, stock=?, low_stock_threshold=?, unit_cost=?, image_url=?, category_id=?,
                    updated_at=CURRENT_TIMESTAMP WHERE id=? AND active=TRUE
                """, request.name().trim(), stock.quantity(), threshold.quantity(),
                normalizeCost(request.unitCost(), request.unit()), request.imageUrl() == null ? current.imageUrl() : request.imageUrl(), request.categoryId(), id);
        return findIngredient(id);
    }

    @Transactional
    public void deleteIngredient(long id) {
        if (count("SELECT COUNT(*) FROM recipe_ingredients WHERE ingredient_id = ?", id) > 0) {
            throw new IllegalArgumentException("La materia prima está utilizada en una receta y no puede eliminarse.");
        }
        if (jdbc.update("UPDATE ingredients SET active=FALSE, updated_at=CURRENT_TIMESTAMP WHERE id=? AND active=TRUE", id) == 0) {
            throw new IllegalArgumentException("La materia prima no existe o ya fue eliminada.");
        }
    }

    @Transactional(readOnly = true)
    public List<RecipeResponse> listRecipes() {
        return jdbc.query("""
                SELECT r.id, r.product_id, p.name, r.yield_quantity
                FROM recipes r JOIN products p ON p.id=r.product_id
                WHERE r.active=TRUE AND p.active=TRUE ORDER BY p.name
                """, (rs, row) -> recipe(rs.getLong("id"), rs.getLong("product_id"),
                rs.getString("name"), rs.getBigDecimal("yield_quantity")));
    }

    @Transactional
    public RecipeResponse saveRecipe(long productId, RecipeRequest request) {
        String productName = jdbc.query("SELECT name FROM products WHERE id=? AND active=TRUE",
                rs -> rs.next() ? rs.getString(1) : null, productId);
        if (productName == null) throw new IllegalArgumentException("El plato seleccionado no existe.");
        jdbc.update("UPDATE products SET name=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
                request.productName().trim(), productId);
        productName = request.productName().trim();
        if (request.ingredients().stream().map(RecipeComponentRequest::ingredientId).distinct().count()
                != request.ingredients().size()) {
            throw new IllegalArgumentException("Una materia prima no puede repetirse en la receta.");
        }
        Long recipeId = jdbc.query("SELECT id FROM recipes WHERE product_id=?", rs -> rs.next() ? rs.getLong(1) : null, productId);
        // Una lista vacía significa venta directa: conservar la receta histórica, pero desactivarla.
        if (request.ingredients().isEmpty()) {
            if (recipeId != null) jdbc.update("UPDATE recipes SET active=FALSE, updated_at=CURRENT_TIMESTAMP WHERE id=?", recipeId);
            return new RecipeResponse(recipeId == null ? 0 : recipeId, productId, productName,
                    request.yieldQuantity(), BigDecimal.ZERO, List.of());
        }
        if (recipeId == null) {
            var key = new GeneratedKeyHolder();
            jdbc.update(connection -> {
                PreparedStatement statement = connection.prepareStatement(
                        "INSERT INTO recipes(product_id,yield_quantity) VALUES (?,?)", new String[]{"id"});
                // Cada parámetro corresponde a su columna: producto (1), rendimiento (2).
                statement.setLong(1, productId);
                statement.setBigDecimal(2, request.yieldQuantity());
                return statement;
            }, key);
            recipeId = Objects.requireNonNull(key.getKey()).longValue();
        } else {
            jdbc.update("UPDATE recipes SET yield_quantity=?, active=TRUE, updated_at=CURRENT_TIMESTAMP WHERE id=?",
                    request.yieldQuantity(), recipeId);
            jdbc.update("DELETE FROM recipe_ingredients WHERE recipe_id=?", recipeId);
        }
        for (RecipeComponentRequest component : request.ingredients()) {
            String baseUnit = jdbc.query("SELECT base_unit FROM ingredients WHERE id=? AND active=TRUE",
                    rs -> rs.next() ? rs.getString(1) : null, component.ingredientId());
            if (baseUnit == null) throw new IllegalArgumentException("Una materia prima de la receta no existe.");
            UnitValue value = normalize(component.quantity(), component.unit());
            if (!baseUnit.equals(value.baseUnit())) throw new IllegalArgumentException("La unidad no corresponde a la materia prima.");
            jdbc.update("INSERT INTO recipe_ingredients(recipe_id,ingredient_id,quantity) VALUES (?,?,?)",
                    recipeId, component.ingredientId(), value.quantity());
        }
        return recipe(recipeId, productId, productName, request.yieldQuantity());
    }

    private RecipeResponse recipe(long id, long productId, String productName, BigDecimal yield) {
        List<RecipeComponentResponse> components = jdbc.query("""
                SELECT i.id, i.name, ri.quantity, i.base_unit
                FROM recipe_ingredients ri JOIN ingredients i ON i.id=ri.ingredient_id
                WHERE ri.recipe_id=? ORDER BY i.name
                """, (rs, row) -> new RecipeComponentResponse(rs.getLong("id"), rs.getString("name"),
                rs.getBigDecimal("quantity"), rs.getString("base_unit")), id);
        BigDecimal batchCost = jdbc.queryForObject("""
                SELECT COALESCE(SUM(ri.quantity*i.unit_cost),0)
                FROM recipe_ingredients ri JOIN ingredients i ON i.id=ri.ingredient_id WHERE ri.recipe_id=?
                """, BigDecimal.class, id);
        return new RecipeResponse(id, productId, productName, yield,
                batchCost.divide(yield, 2, RoundingMode.HALF_UP), components);
    }

    private IngredientResponse findIngredient(long id) {
        IngredientResponse result = jdbc.query("""
                SELECT id,name,base_unit,stock,low_stock_threshold,unit_cost,image_url,category_id
                FROM ingredients WHERE id=? AND active=TRUE
                """, rs -> rs.next() ? ingredient(rs.getLong("id"),rs.getString("name"),
                rs.getString("base_unit"),rs.getBigDecimal("stock"),rs.getBigDecimal("low_stock_threshold"),
                rs.getBigDecimal("unit_cost"),rs.getString("image_url"), rs.getLong("category_id")) : null, id);
        if (result == null) throw new IllegalArgumentException("La materia prima no existe.");
        return result;
    }

    private IngredientResponse ingredient(long id,String name,String unit,BigDecimal stock,BigDecimal threshold,BigDecimal cost,String imageUrl,long categoryId) {
        String status = stock.signum()==0 ? "OUT_OF_STOCK" : stock.compareTo(threshold)<=0 ? "LOW_STOCK" : "NORMAL";
        return new IngredientResponse(id,name,unit,stock,threshold,cost,status,imageUrl,categoryId);
    }

    /** Reject unknown or inactive categories before persisting an ingredient. */
    private void requireCategory(Long id) {
        if (id == null || jdbc.queryForList("SELECT id FROM ingredient_categories WHERE id=? AND active=TRUE FOR UPDATE", Long.class, id).isEmpty())
            throw new IllegalArgumentException("Selecciona una categoría de insumo válida.");
    }

    private UnitValue normalize(BigDecimal quantity, String unit) {
        String normalized = unit.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "KG" -> new UnitValue(quantity.multiply(BigDecimal.valueOf(1000)), "G");
            case "G" -> new UnitValue(quantity, "G");
            case "L" -> new UnitValue(quantity.multiply(BigDecimal.valueOf(1000)), "ML");
            case "ML" -> new UnitValue(quantity, "ML");
            case "UNIT", "UNIDAD", "UNIDADES" -> new UnitValue(quantity, "UNIT");
            default -> throw new IllegalArgumentException("Unidad inválida. Usa kg, g, l, ml o unidad.");
        };
    }

    private BigDecimal normalizeCost(BigDecimal cost, String unit) {
        String normalized = unit.trim().toUpperCase(Locale.ROOT);
        return (normalized.equals("KG") || normalized.equals("L"))
                ? cost.divide(BigDecimal.valueOf(1000), 4, RoundingMode.HALF_UP) : cost;
    }

    private long count(String sql, Object... args) { return jdbc.queryForObject(sql, Long.class, args); }
    private record UnitValue(BigDecimal quantity, String baseUnit) {}
}
