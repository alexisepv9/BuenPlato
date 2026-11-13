-- Datos de desarrollo idempotentes para categorías, productos y menú buffet.
-- MERGE evita duplicados al reiniciar el entorno local.
MERGE INTO categories (name, slug, category_type, display_order, active) KEY(slug) VALUES
    ('Proteínas', 'proteinas', 'COMPONENT', 1, TRUE),
    ('Agregados', 'agregados', 'COMPONENT', 2, TRUE),
    ('Ensaladas', 'ensaladas', 'COMPONENT', 3, TRUE),
    ('Postres', 'postres', 'COMPONENT', 4, TRUE),
    ('Bebestibles', 'bebestibles', 'STANDALONE', 5, TRUE),
    ('Extras', 'extras', 'STANDALONE', 6, TRUE),
    ('Pan', 'pan', 'COMPONENT', 7, TRUE);

INSERT INTO products (category_id, name, description, price, unit, stock, low_stock_threshold, track_stock, active, created_at, updated_at)
SELECT v.* FROM (VALUES ((SELECT id FROM categories WHERE slug = 'proteinas'), 'Salmón premium', 'Filete de salmón 200 g', 4500, 'porciones', 18, 6, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'agregados'), 'Vegetales rostizados', 'Mix de vegetales de estación', 1800, 'porciones', 48, 12, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'postres'), 'Mousse de chocolate', 'Chocolate 70% cacao', 2200, 'porciones', 32, 8, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'proteinas'), 'Pollo grillado', 'Pechuga marinada con hierbas', 3500, 'porciones', 60, 12, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'proteinas'), 'Carne mechada', 'Vacuno cocido lentamente', 4800, 'porciones', 35, 8, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'agregados'), 'Arroz primavera', 'Arroz con vegetales de estación', 1600, 'porciones', 90, 18, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'agregados'), 'Papas rústicas', 'Papas al horno con romero', 1900, 'porciones', 70, 15, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'agregados'), 'Arroz blanco', 'Arroz blanco graneado', 1400, 'porciones', 60, 12, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'agregados'), 'Tallarines con salsa roja', 'Pasta con salsa de tomate', 1900, 'porciones', 48, 10, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'agregados'), 'Tallarines con salsa verde', 'Pasta con salsa de albahaca', 2100, 'porciones', 48, 10, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'ensaladas'), 'Ensalada fresca', 'Lechuga, pepino y zanahoria', 1500, 'porciones', 55, 12, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'ensaladas'), 'Ensalada chilena', 'Tomate y cebolla pluma', 1600, 'porciones', 45, 10, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'postres'), 'Fruta de estación', 'Porción individual', 1400, 'porciones', 40, 8, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'bebestibles'), 'Bebida lata', 'Lata 350 ml', 1500, 'unidades', 72, 15, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'bebestibles'), 'Agua mineral', 'Botella 500 ml', 1200, 'unidades', 80, 15, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'bebestibles'), 'Jugo natural', 'Vaso 400 ml', 1800, 'unidades', 30, 8, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'bebestibles'), 'Agua Cachantun 1 L', 'Botella individual de un litro', 1800, 'unidades', 24, 6, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'bebestibles'), 'Bebida Express 500 ml', 'Botella individual', 1700, 'unidades', 24, 6, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'extras'), 'Empanada de queso', 'Unidad horneada', 1800, 'unidades', 24, 6, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)) v(category_id, name, description, price, unit, stock, low_stock_threshold, track_stock, active, created_at, updated_at)
WHERE NOT EXISTS (SELECT 1 FROM products existing WHERE existing.name=v.name) AND NOT EXISTS (SELECT 1 FROM flyway_schema_history WHERE script='R__dev_buffet_catalog.sql' AND success=TRUE);

MERGE INTO menus (
    name, description, base_price, available_from, available_to, active, created_at
) KEY(name) VALUES (
    'Almuerzo Buffet',
    'Incluye proteína, hasta dos agregados, ensalada y postre opcional.',
    6900,
    CURRENT_DATE,
    NULL,
    TRUE,
    CURRENT_TIMESTAMP
);

MERGE INTO menu_sections (
    menu_id, category_id, label, minimum_selections, maximum_selections, required, display_order
) KEY(menu_id, category_id) VALUES
    ((SELECT id FROM menus WHERE name = 'Almuerzo Buffet'), (SELECT id FROM categories WHERE slug = 'proteinas'), 'Elige tu proteína', 1, 1, TRUE, 1),
    ((SELECT id FROM menus WHERE name = 'Almuerzo Buffet'), (SELECT id FROM categories WHERE slug = 'agregados'), 'Elige hasta dos agregados', 1, 2, TRUE, 2),
    ((SELECT id FROM menus WHERE name = 'Almuerzo Buffet'), (SELECT id FROM categories WHERE slug = 'ensaladas'), 'Elige una ensalada', 1, 1, TRUE, 3),
    ((SELECT id FROM menus WHERE name = 'Almuerzo Buffet'), (SELECT id FROM categories WHERE slug = 'postres'), 'Agrega un postre', 0, 1, FALSE, 4);

MERGE INTO menu_options (menu_section_id, product_id, extra_price, active)
KEY(menu_section_id, product_id) VALUES
    ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id = ms.menu_id JOIN categories c ON c.id = ms.category_id WHERE m.name = 'Almuerzo Buffet' AND c.slug = 'proteinas'), (SELECT id FROM products WHERE name = 'Pollo grillado'), 0, TRUE),
    ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id = ms.menu_id JOIN categories c ON c.id = ms.category_id WHERE m.name = 'Almuerzo Buffet' AND c.slug = 'proteinas'), (SELECT id FROM products WHERE name = 'Carne mechada'), 1500, TRUE),
    ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id = ms.menu_id JOIN categories c ON c.id = ms.category_id WHERE m.name = 'Almuerzo Buffet' AND c.slug = 'proteinas'), (SELECT id FROM products WHERE name = 'Salmón premium'), 2000, TRUE),
    ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id = ms.menu_id JOIN categories c ON c.id = ms.category_id WHERE m.name = 'Almuerzo Buffet' AND c.slug = 'agregados'), (SELECT id FROM products WHERE name = 'Arroz primavera'), 0, TRUE),
    ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id = ms.menu_id JOIN categories c ON c.id = ms.category_id WHERE m.name = 'Almuerzo Buffet' AND c.slug = 'agregados'), (SELECT id FROM products WHERE name = 'Papas rústicas'), 0, TRUE),
    ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id = ms.menu_id JOIN categories c ON c.id = ms.category_id WHERE m.name = 'Almuerzo Buffet' AND c.slug = 'agregados'), (SELECT id FROM products WHERE name = 'Arroz blanco'), 0, TRUE),
    ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id = ms.menu_id JOIN categories c ON c.id = ms.category_id WHERE m.name = 'Almuerzo Buffet' AND c.slug = 'agregados'), (SELECT id FROM products WHERE name = 'Tallarines con salsa roja'), 0, TRUE),
    ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id = ms.menu_id JOIN categories c ON c.id = ms.category_id WHERE m.name = 'Almuerzo Buffet' AND c.slug = 'agregados'), (SELECT id FROM products WHERE name = 'Tallarines con salsa verde'), 0, TRUE),
    ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id = ms.menu_id JOIN categories c ON c.id = ms.category_id WHERE m.name = 'Almuerzo Buffet' AND c.slug = 'agregados'), (SELECT id FROM products WHERE name = 'Vegetales rostizados'), 500, TRUE),
    ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id = ms.menu_id JOIN categories c ON c.id = ms.category_id WHERE m.name = 'Almuerzo Buffet' AND c.slug = 'ensaladas'), (SELECT id FROM products WHERE name = 'Ensalada fresca'), 0, TRUE),
    ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id = ms.menu_id JOIN categories c ON c.id = ms.category_id WHERE m.name = 'Almuerzo Buffet' AND c.slug = 'ensaladas'), (SELECT id FROM products WHERE name = 'Ensalada chilena'), 0, TRUE),
    ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id = ms.menu_id JOIN categories c ON c.id = ms.category_id WHERE m.name = 'Almuerzo Buffet' AND c.slug = 'postres'), (SELECT id FROM products WHERE name = 'Fruta de estación'), 0, TRUE),
    ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id = ms.menu_id JOIN categories c ON c.id = ms.category_id WHERE m.name = 'Almuerzo Buffet' AND c.slug = 'postres'), (SELECT id FROM products WHERE name = 'Mousse de chocolate'), 900, TRUE);
