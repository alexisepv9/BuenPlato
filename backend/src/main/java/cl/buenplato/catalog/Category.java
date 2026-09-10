/**
 * Entidad JPA que clasifica productos y componentes del buffet.
 */
package cl.buenplato.catalog;

import jakarta.persistence.*;

@Entity
@Table(name = "categories")
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false, unique = true, length = 80)
    private String slug;

    @Column(name = "category_type", nullable = false, length = 30)
    private String categoryType;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(nullable = false)
    private boolean active = true;

    protected Category() {}

    public Category(String name, String slug, String categoryType, int displayOrder) {
        this.name = name;
        this.slug = slug;
        this.categoryType = categoryType;
        this.displayOrder = displayOrder;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getSlug() { return slug; }
    public String getCategoryType() { return categoryType; }
    public int getDisplayOrder() { return displayOrder; }
    public boolean isActive() { return active; }
}
