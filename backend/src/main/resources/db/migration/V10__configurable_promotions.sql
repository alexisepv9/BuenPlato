-- Distingue promociones de colaciones sin modificar ventas históricas.
ALTER TABLE menus ADD COLUMN menu_kind VARCHAR(20) NOT NULL DEFAULT 'COLACION';
ALTER TABLE menus ADD CONSTRAINT ck_menu_kind CHECK (menu_kind IN ('COLACION', 'PROMOTION'));
ALTER TABLE menus ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;

-- Catálogo base, sin duplicar categorías existentes ni inventar stock/productos.
INSERT INTO categories (name, slug, category_type, display_order, active)
SELECT 'Sándwiches', 'sandwiches', 'STANDALONE', 80, TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'sandwiches');
INSERT INTO categories (name, slug, category_type, display_order, active)
SELECT 'Completos', 'completos', 'STANDALONE', 81, TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'completos');
