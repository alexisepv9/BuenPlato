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

MERGE INTO products (
    category_id, sku, name, description, price, unit, stock,
    low_stock_threshold, track_stock, active, created_at, updated_at
) KEY(sku) VALUES
    ((SELECT id FROM categories WHERE slug = 'proteinas'), 'PRO-001', 'Salmón premium', 'Filete de salmón 200 g', 4500, 'porciones', 18, 6, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'agregados'), 'AGR-001', 'Vegetales rostizados', 'Mix de vegetales de estación', 1800, 'porciones', 48, 12, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'postres'), 'POS-001', 'Mousse de chocolate', 'Chocolate 70% cacao', 2200, 'porciones', 32, 8, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'proteinas'), 'PRO-010', 'Pollo grillado', 'Pechuga marinada con hierbas', 3500, 'porciones', 60, 12, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'proteinas'), 'PRO-011', 'Carne mechada', 'Vacuno cocido lentamente', 4800, 'porciones', 35, 8, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'agregados'), 'AGR-010', 'Arroz primavera', 'Arroz con vegetales de estación', 1600, 'porciones', 90, 18, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'agregados'), 'AGR-011', 'Papas rústicas', 'Papas al horno con romero', 1900, 'porciones', 70, 15, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'ensaladas'), 'ENS-010', 'Ensalada fresca', 'Lechuga, pepino y zanahoria', 1500, 'porciones', 55, 12, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'ensaladas'), 'ENS-011', 'Ensalada chilena', 'Tomate y cebolla pluma', 1600, 'porciones', 45, 10, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'postres'), 'POS-010', 'Fruta de estación', 'Porción individual', 1400, 'porciones', 40, 8, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'bebestibles'), 'BEB-010', 'Bebida lata', 'Lata 350 ml', 1500, 'unidades', 72, 15, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'bebestibles'), 'BEB-011', 'Agua mineral', 'Botella 500 ml', 1200, 'unidades', 80, 15, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'bebestibles'), 'BEB-012', 'Jugo natural', 'Vaso 400 ml', 1800, 'unidades', 30, 8, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ((SELECT id FROM categories WHERE slug = 'extras'), 'EXT-010', 'Empanada de queso', 'Unidad horneada', 1800, 'unidades', 24, 6, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

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
    ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id = ms.menu_id JOIN categories c ON c.id = ms.category_id WHERE m.name = 'Almuerzo Buffet' AND c.slug = 'proteinas'), (SELECT id FROM products WHERE sku = 'PRO-010'), 0, TRUE),
    ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id = ms.menu_id JOIN categories c ON c.id = ms.category_id WHERE m.name = 'Almuerzo Buffet' AND c.slug = 'proteinas'), (SELECT id FROM products WHERE sku = 'PRO-011'), 1500, TRUE),
    ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id = ms.menu_id JOIN categories c ON c.id = ms.category_id WHERE m.name = 'Almuerzo Buffet' AND c.slug = 'proteinas'), (SELECT id FROM products WHERE sku = 'PRO-001'), 2000, TRUE),
    ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id = ms.menu_id JOIN categories c ON c.id = ms.category_id WHERE m.name = 'Almuerzo Buffet' AND c.slug = 'agregados'), (SELECT id FROM products WHERE sku = 'AGR-010'), 0, TRUE),
    ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id = ms.menu_id JOIN categories c ON c.id = ms.category_id WHERE m.name = 'Almuerzo Buffet' AND c.slug = 'agregados'), (SELECT id FROM products WHERE sku = 'AGR-011'), 0, TRUE),
    ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id = ms.menu_id JOIN categories c ON c.id = ms.category_id WHERE m.name = 'Almuerzo Buffet' AND c.slug = 'agregados'), (SELECT id FROM products WHERE sku = 'AGR-001'), 500, TRUE),
    ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id = ms.menu_id JOIN categories c ON c.id = ms.category_id WHERE m.name = 'Almuerzo Buffet' AND c.slug = 'ensaladas'), (SELECT id FROM products WHERE sku = 'ENS-010'), 0, TRUE),
    ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id = ms.menu_id JOIN categories c ON c.id = ms.category_id WHERE m.name = 'Almuerzo Buffet' AND c.slug = 'ensaladas'), (SELECT id FROM products WHERE sku = 'ENS-011'), 0, TRUE),
    ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id = ms.menu_id JOIN categories c ON c.id = ms.category_id WHERE m.name = 'Almuerzo Buffet' AND c.slug = 'postres'), (SELECT id FROM products WHERE sku = 'POS-010'), 0, TRUE),
    ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id = ms.menu_id JOIN categories c ON c.id = ms.category_id WHERE m.name = 'Almuerzo Buffet' AND c.slug = 'postres'), (SELECT id FROM products WHERE sku = 'POS-001'), 900, TRUE);
