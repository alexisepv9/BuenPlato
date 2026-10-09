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
  ((SELECT id FROM categories WHERE slug='agregados'), 'AGR-012', 'Arroz blanco', 'Arroz blanco graneado', 1400, 'porciones', 60, 12, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='agregados'), 'AGR-013', 'Tallarines con salsa roja', 'Pasta con salsa de tomate', 1900, 'porciones', 48, 10, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='agregados'), 'AGR-014', 'Tallarines con salsa verde', 'Pasta con salsa de albahaca', 2100, 'porciones', 48, 10, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='ensaladas'), 'ENS-010', 'Ensalada fresca', 'Lechuga, pepino y zanahoria', 1500, 'porciones', 55, 12, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='ensaladas'), 'ENS-011', 'Ensalada chilena', 'Tomate y cebolla pluma', 1600, 'porciones', 45, 10, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='postres'), 'POS-010', 'Fruta de estación', 'Porción individual', 1400, 'porciones', 40, 8, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='bebestibles'), 'BEB-010', 'Bebida lata', 'Lata 350 ml', 1500, 'unidades', 72, 15, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='bebestibles'), 'BEB-011', 'Agua mineral', 'Botella 500 ml', 1200, 'unidades', 80, 15, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='bebestibles'), 'BEB-012', 'Jugo natural', 'Vaso 400 ml', 1800, 'unidades', 30, 8, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='bebestibles'), 'BEB-013', 'Agua Cachantun 1 L', 'Botella individual de un litro', 1800, 'unidades', 24, 6, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='bebestibles'), 'BEB-014', 'Bebida Express 500 ml', 'Botella individual', 1700, 'unidades', 24, 6, TRUE, TRUE),
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
  ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id=ms.menu_id JOIN categories c ON c.id=ms.category_id WHERE m.name='Almuerzo Buffet' AND c.slug='agregados'), (SELECT id FROM products WHERE sku='AGR-012'), 0, TRUE),
  ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id=ms.menu_id JOIN categories c ON c.id=ms.category_id WHERE m.name='Almuerzo Buffet' AND c.slug='agregados'), (SELECT id FROM products WHERE sku='AGR-013'), 0, TRUE),
  ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id=ms.menu_id JOIN categories c ON c.id=ms.category_id WHERE m.name='Almuerzo Buffet' AND c.slug='agregados'), (SELECT id FROM products WHERE sku='AGR-014'), 0, TRUE),
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

-- Materias primas y recetas iniciales. DO NOTHING preserva stock y ajustes administrativos.
INSERT INTO ingredients (sku,name,base_unit,stock,low_stock_threshold,unit_cost,active) VALUES
('MP-CARNE','Carne de vacuno','G',10000,2000,8.5000,TRUE),('MP-POLLO','Pechuga de pollo','G',10000,2000,5.5000,TRUE),('MP-SALMON','Salmón','G',5000,1000,12.0000,TRUE),
('MP-SAL','Sal','G',1000,200,0.8000,TRUE),('MP-ZANAHORIA','Zanahoria','G',5000,1000,1.2000,TRUE),('MP-CEBOLLA','Cebolla','G',5000,1000,1.1000,TRUE),
('MP-AJO','Ajo','UNIT',100,20,120.0000,TRUE),('MP-ARROZ','Arroz','G',10000,2000,1.6000,TRUE),('MP-ACEITE','Aceite vegetal','ML',5000,1000,2.2000,TRUE),
('MP-VEGETALES','Vegetales mixtos','G',8000,1500,2.5000,TRUE),('MP-PAPA','Papa','G',12000,2500,1.3000,TRUE),('MP-ROMERO','Romero','G',300,50,8.0000,TRUE),
('MP-LECHUGA','Lechuga','G',4000,800,2.2000,TRUE),('MP-PEPINO','Pepino','G',4000,800,1.8000,TRUE),('MP-TOMATE','Tomate','G',8000,1500,2.0000,TRUE),
('MP-CHOCOLATE','Chocolate','G',3000,500,8.0000,TRUE),('MP-CREMA','Crema','ML',4000,800,3.0000,TRUE),('MP-AZUCAR','Azúcar','G',4000,800,1.1000,TRUE),
('MP-FRUTA','Fruta de estación','G',8000,1500,2.2000,TRUE),('MP-HARINA','Harina','G',10000,2000,1.0000,TRUE),('MP-QUESO','Queso','G',5000,1000,5.5000,TRUE),
('MP-PASTA','Tallarines secos','G',10000,2000,1.8000,TRUE),('MP-SALSA-TOMATE','Salsa de tomate','G',6000,1200,2.3000,TRUE),('MP-ALBAHACA','Albahaca','G',1000,200,9.0000,TRUE)
ON CONFLICT (sku) DO NOTHING;

INSERT INTO recipes(product_id,yield_quantity,active)
SELECT p.id,v.yield_quantity,TRUE FROM (VALUES
('PRO-001',4),('PRO-010',4),('PRO-011',4),('AGR-001',4),('AGR-010',8),('AGR-011',6),('AGR-012',8),('AGR-013',8),('AGR-014',8),
('ENS-010',6),('ENS-011',6),('POS-001',6),('POS-010',6),('EXT-010',12)
) v(sku,yield_quantity) JOIN products p ON p.sku=v.sku ON CONFLICT (product_id) DO NOTHING;

INSERT INTO recipe_ingredients(recipe_id,ingredient_id,quantity)
SELECT r.id,i.id,v.quantity FROM (VALUES
('PRO-001','MP-SALMON',800),('PRO-001','MP-SAL',12),('PRO-001','MP-ACEITE',20),
('PRO-010','MP-POLLO',800),('PRO-010','MP-SAL',12),('PRO-010','MP-ACEITE',20),('PRO-010','MP-AJO',2),
('PRO-011','MP-CARNE',1000),('PRO-011','MP-SAL',6),('PRO-011','MP-ZANAHORIA',100),('PRO-011','MP-CEBOLLA',100),('PRO-011','MP-AJO',2),
('AGR-001','MP-VEGETALES',1000),('AGR-001','MP-ACEITE',30),('AGR-001','MP-SAL',8),
('AGR-010','MP-ARROZ',1000),('AGR-010','MP-VEGETALES',400),('AGR-010','MP-ACEITE',30),('AGR-010','MP-SAL',12),
('AGR-011','MP-PAPA',1500),('AGR-011','MP-ACEITE',40),('AGR-011','MP-ROMERO',8),('AGR-011','MP-SAL',12),
('AGR-012','MP-ARROZ',1000),('AGR-012','MP-ACEITE',20),('AGR-012','MP-SAL',12),
('AGR-013','MP-PASTA',1000),('AGR-013','MP-SALSA-TOMATE',800),('AGR-013','MP-CEBOLLA',100),('AGR-013','MP-AJO',2),('AGR-013','MP-ACEITE',20),
('AGR-014','MP-PASTA',1000),('AGR-014','MP-ALBAHACA',200),('AGR-014','MP-QUESO',150),('AGR-014','MP-AJO',2),('AGR-014','MP-ACEITE',250),
('ENS-010','MP-LECHUGA',600),('ENS-010','MP-PEPINO',300),('ENS-010','MP-ZANAHORIA',300),('ENS-010','MP-ACEITE',20),('ENS-010','MP-SAL',8),
('ENS-011','MP-TOMATE',900),('ENS-011','MP-CEBOLLA',500),('ENS-011','MP-ACEITE',20),('ENS-011','MP-SAL',8),
('POS-001','MP-CHOCOLATE',300),('POS-001','MP-CREMA',500),('POS-001','MP-AZUCAR',100),('POS-010','MP-FRUTA',1200),
('EXT-010','MP-HARINA',1000),('EXT-010','MP-QUESO',600),('EXT-010','MP-ACEITE',100),('EXT-010','MP-SAL',20)
) v(product_sku,ingredient_sku,quantity)
JOIN products p ON p.sku=v.product_sku JOIN recipes r ON r.product_id=p.id JOIN ingredients i ON i.sku=v.ingredient_sku
ON CONFLICT (recipe_id,ingredient_id) DO NOTHING;
