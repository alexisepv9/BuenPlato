-- Datos idempotentes PostgreSQL para probar el sistema completo en Docker.
INSERT INTO app_users (email, display_name, password_hash, role, active)
VALUES
  ('admin@buenplato.cl', 'Administrador Buen Plato', '$2a$10$9VD9G40O7bT4UfzKRmocFe2WGS8WRr2PT6J3oT0MHA5Adm4KXFiYa', 'ADMIN', TRUE),
  ('caja@buenplato.cl', 'Caja Buen Plato', '$2a$10$0pL/Xm1225AKyyE4CsHsOOqYPv3rqQ3ZMwJc9KIs9eCu5I/QCxi4q', 'CASHIER', TRUE)
ON CONFLICT (email) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  active = EXCLUDED.active;

INSERT INTO categories (name, slug, category_type, display_order, active)
VALUES
  ('Proteínas', 'proteinas', 'COMPONENT', 1, TRUE),
  ('Agregados', 'agregados', 'COMPONENT', 2, TRUE),
  ('Ensaladas', 'ensaladas', 'COMPONENT', 3, TRUE),
  ('Postres', 'postres', 'COMPONENT', 4, TRUE),
  ('Bebestibles', 'bebestibles', 'STANDALONE', 5, TRUE),
  ('Extras', 'extras', 'STANDALONE', 6, TRUE),
  ('Pan', 'pan', 'COMPONENT', 7, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category_type = EXCLUDED.category_type,
  display_order = EXCLUDED.display_order,
  active = EXCLUDED.active;

INSERT INTO products (
  category_id, sku, name, description, price, unit, stock,
  low_stock_threshold, track_stock, active
)
VALUES
  ((SELECT id FROM categories WHERE slug='proteinas'), 'PRO-001', 'Salmón premium', 'Filete de salmón 200 g', 4500, 'porciones', 18, 6, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='agregados'), 'AGR-001', 'Vegetales rostizados', 'Mix de vegetales de estación', 1800, 'porciones', 48, 12, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='postres'), 'POS-001', 'Mousse de chocolate', 'Chocolate 70% cacao', 2200, 'porciones', 32, 8, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='proteinas'), 'PRO-010', 'Pollo grillado', 'Pechuga marinada con hierbas', 3500, 'porciones', 60, 12, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='proteinas'), 'PRO-011', 'Carne mechada', 'Vacuno cocido lentamente', 4800, 'porciones', 35, 8, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='agregados'), 'AGR-010', 'Arroz primavera', 'Arroz con vegetales de estación', 1600, 'porciones', 90, 18, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='agregados'), 'AGR-011', 'Papas rústicas', 'Papas al horno con romero', 1900, 'porciones', 70, 15, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='ensaladas'), 'ENS-010', 'Ensalada fresca', 'Lechuga, pepino y zanahoria', 1500, 'porciones', 55, 12, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='ensaladas'), 'ENS-011', 'Ensalada chilena', 'Tomate y cebolla pluma', 1600, 'porciones', 45, 10, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='postres'), 'POS-010', 'Fruta de estación', 'Porción individual', 1400, 'porciones', 40, 8, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='bebestibles'), 'BEB-010', 'Bebida lata', 'Lata 350 ml', 1500, 'unidades', 72, 15, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='bebestibles'), 'BEB-011', 'Agua mineral', 'Botella 500 ml', 1200, 'unidades', 80, 15, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='bebestibles'), 'BEB-012', 'Jugo natural', 'Vaso 400 ml', 1800, 'unidades', 30, 8, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='extras'), 'EXT-010', 'Empanada de queso', 'Unidad horneada', 1800, 'unidades', 24, 6, TRUE, TRUE)
ON CONFLICT (sku) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  track_stock = EXCLUDED.track_stock,
  active = EXCLUDED.active,
  updated_at = CURRENT_TIMESTAMP;

UPDATE products SET unit_cost = CASE sku
  WHEN 'PRO-001' THEN 2900 WHEN 'PRO-010' THEN 1900 WHEN 'PRO-011' THEN 2800
  WHEN 'AGR-001' THEN 850 WHEN 'AGR-010' THEN 650 WHEN 'AGR-011' THEN 800
  WHEN 'ENS-010' THEN 600 WHEN 'ENS-011' THEN 650
  WHEN 'POS-001' THEN 1100 WHEN 'POS-010' THEN 600
  WHEN 'BEB-010' THEN 800 WHEN 'BEB-011' THEN 550 WHEN 'BEB-012' THEN 850
  WHEN 'EXT-010' THEN 900 ELSE unit_cost END
WHERE sku IN ('PRO-001','PRO-010','PRO-011','AGR-001','AGR-010','AGR-011','ENS-010','ENS-011','POS-001','POS-010','BEB-010','BEB-011','BEB-012','EXT-010');

INSERT INTO menus (name, description, base_price, available_from, active)
VALUES ('Almuerzo Buffet', 'Incluye proteína, hasta dos agregados, ensalada y postre opcional.', 6900, CURRENT_DATE, TRUE)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price,
  active = EXCLUDED.active;

INSERT INTO menu_sections (
  menu_id, category_id, label, minimum_selections, maximum_selections, required, display_order
)
VALUES
  ((SELECT id FROM menus WHERE name='Almuerzo Buffet'), (SELECT id FROM categories WHERE slug='proteinas'), 'Elige tu proteína', 1, 1, TRUE, 1),
  ((SELECT id FROM menus WHERE name='Almuerzo Buffet'), (SELECT id FROM categories WHERE slug='agregados'), 'Elige hasta dos agregados', 1, 2, TRUE, 2),
  ((SELECT id FROM menus WHERE name='Almuerzo Buffet'), (SELECT id FROM categories WHERE slug='ensaladas'), 'Elige una ensalada', 1, 1, TRUE, 3),
  ((SELECT id FROM menus WHERE name='Almuerzo Buffet'), (SELECT id FROM categories WHERE slug='postres'), 'Agrega un postre', 0, 1, FALSE, 4)
ON CONFLICT (menu_id, category_id) DO UPDATE SET
  label = EXCLUDED.label,
  minimum_selections = EXCLUDED.minimum_selections,
  maximum_selections = EXCLUDED.maximum_selections,
  required = EXCLUDED.required,
  display_order = EXCLUDED.display_order;

INSERT INTO menu_options (menu_section_id, product_id, extra_price, active)
VALUES
  ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id=ms.menu_id JOIN categories c ON c.id=ms.category_id WHERE m.name='Almuerzo Buffet' AND c.slug='proteinas'), (SELECT id FROM products WHERE sku='PRO-010'), 0, TRUE),
  ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id=ms.menu_id JOIN categories c ON c.id=ms.category_id WHERE m.name='Almuerzo Buffet' AND c.slug='proteinas'), (SELECT id FROM products WHERE sku='PRO-011'), 1500, TRUE),
  ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id=ms.menu_id JOIN categories c ON c.id=ms.category_id WHERE m.name='Almuerzo Buffet' AND c.slug='proteinas'), (SELECT id FROM products WHERE sku='PRO-001'), 2000, TRUE),
  ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id=ms.menu_id JOIN categories c ON c.id=ms.category_id WHERE m.name='Almuerzo Buffet' AND c.slug='agregados'), (SELECT id FROM products WHERE sku='AGR-010'), 0, TRUE),
  ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id=ms.menu_id JOIN categories c ON c.id=ms.category_id WHERE m.name='Almuerzo Buffet' AND c.slug='agregados'), (SELECT id FROM products WHERE sku='AGR-011'), 0, TRUE),
  ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id=ms.menu_id JOIN categories c ON c.id=ms.category_id WHERE m.name='Almuerzo Buffet' AND c.slug='agregados'), (SELECT id FROM products WHERE sku='AGR-001'), 500, TRUE),
  ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id=ms.menu_id JOIN categories c ON c.id=ms.category_id WHERE m.name='Almuerzo Buffet' AND c.slug='ensaladas'), (SELECT id FROM products WHERE sku='ENS-010'), 0, TRUE),
  ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id=ms.menu_id JOIN categories c ON c.id=ms.category_id WHERE m.name='Almuerzo Buffet' AND c.slug='ensaladas'), (SELECT id FROM products WHERE sku='ENS-011'), 0, TRUE),
  ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id=ms.menu_id JOIN categories c ON c.id=ms.category_id WHERE m.name='Almuerzo Buffet' AND c.slug='postres'), (SELECT id FROM products WHERE sku='POS-010'), 0, TRUE),
  ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id=ms.menu_id JOIN categories c ON c.id=ms.category_id WHERE m.name='Almuerzo Buffet' AND c.slug='postres'), (SELECT id FROM products WHERE sku='POS-001'), 900, TRUE)
ON CONFLICT (menu_section_id, product_id) DO UPDATE SET
  extra_price = EXCLUDED.extra_price,
  active = EXCLUDED.active;

INSERT INTO expenses (
  reference_code, expense_date, category, description, expense_type,
  amount, payment_method, created_by
)
VALUES
  ('DOCKER-ARRIENDO-MES', DATE_TRUNC('month', CURRENT_DATE)::date, 'Arriendo', 'Arriendo mensual del local', 'FIXED', 650000, 'TRANSFER', (SELECT id FROM app_users WHERE email='admin@buenplato.cl')),
  ('DOCKER-SERVICIOS-MES', DATE_TRUNC('month', CURRENT_DATE)::date, 'Servicios', 'Electricidad, agua y gas', 'FIXED', 185000, 'TRANSFER', (SELECT id FROM app_users WHERE email='admin@buenplato.cl')),
  ('DOCKER-INSUMOS-MES', CURRENT_DATE, 'Insumos', 'Envases, servilletas y limpieza', 'VARIABLE', 95000, 'CARD', (SELECT id FROM app_users WHERE email='admin@buenplato.cl'))
ON CONFLICT (reference_code) DO UPDATE SET
  expense_date = EXCLUDED.expense_date,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  expense_type = EXCLUDED.expense_type,
  amount = EXCLUDED.amount,
  payment_method = EXCLUDED.payment_method;
