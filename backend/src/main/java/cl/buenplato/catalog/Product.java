/**
 * Entidad JPA de producto con precio, unidad y control de stock.
 */
package cl.buenplato.catalog;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false, unique = true, length = 60)
    private String sku;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private int price;

    @Column(nullable = false, length = 30)
    private String unit;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal stock;

    @Column(name = "low_stock_threshold", nullable = false, precision = 12, scale = 2)
    private BigDecimal lowStockThreshold;

    @Column(name = "track_stock", nullable = false)
    private boolean trackStock;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected Product() {}

    public Product(
            Category category,
            String sku,
            String name,
            String description,
            int price,
            String unit,
            BigDecimal stock,
            BigDecimal lowStockThreshold,
            boolean trackStock
    ) {
        this.category = category;
        this.sku = sku;
        this.name = name;
        this.description = description;
        this.price = price;
        this.unit = unit;
        this.stock = stock;
        this.lowStockThreshold = lowStockThreshold;
        this.trackStock = trackStock;
        this.active = true;
    }

    @PrePersist
    void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public void update(
            Category category,
            String sku,
            String name,
            String description,
            int price,
            String unit,
            BigDecimal stock,
            BigDecimal lowStockThreshold,
            boolean trackStock
    ) {
        this.category = category;
        this.sku = sku;
        this.name = name;
        this.description = description;
        this.price = price;
        this.unit = unit;
        this.stock = stock;
        this.lowStockThreshold = lowStockThreshold;
        this.trackStock = trackStock;
    }

    public void deactivate() {
        this.active = false;
    }

    public Long getId() { return id; }
    public Category getCategory() { return category; }
    public String getSku() { return sku; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public int getPrice() { return price; }
    public String getUnit() { return unit; }
    public BigDecimal getStock() { return stock; }
    public BigDecimal getLowStockThreshold() { return lowStockThreshold; }
    public boolean isTrackStock() { return trackStock; }
    public boolean isActive() { return active; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
