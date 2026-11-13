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

INSERT INTO products (category_id, name, description, price, unit, stock, low_stock_threshold, track_stock, active)
SELECT v.* FROM (VALUES ((SELECT id FROM categories WHERE slug='proteinas'), 'Salmón premium', 'Filete de salmón 200 g', 4500, 'porciones', 18, 6, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='agregados'), 'Vegetales rostizados', 'Mix de vegetales de estación', 1800, 'porciones', 48, 12, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='postres'), 'Mousse de chocolate', 'Chocolate 70% cacao', 2200, 'porciones', 32, 8, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='proteinas'), 'Pollo grillado', 'Pechuga marinada con hierbas', 3500, 'porciones', 60, 12, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='proteinas'), 'Carne mechada', 'Vacuno cocido lentamente', 4800, 'porciones', 35, 8, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='agregados'), 'Arroz primavera', 'Arroz con vegetales de estación', 1600, 'porciones', 90, 18, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='agregados'), 'Papas rústicas', 'Papas al horno con romero', 1900, 'porciones', 70, 15, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='agregados'), 'Arroz blanco', 'Arroz blanco graneado', 1400, 'porciones', 60, 12, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='agregados'), 'Tallarines con salsa roja', 'Pasta con salsa de tomate', 1900, 'porciones', 48, 10, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='agregados'), 'Tallarines con salsa verde', 'Pasta con salsa de albahaca', 2100, 'porciones', 48, 10, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='ensaladas'), 'Ensalada fresca', 'Lechuga, pepino y zanahoria', 1500, 'porciones', 55, 12, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='ensaladas'), 'Ensalada chilena', 'Tomate y cebolla pluma', 1600, 'porciones', 45, 10, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='postres'), 'Fruta de estación', 'Porción individual', 1400, 'porciones', 40, 8, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='bebestibles'), 'Bebida lata', 'Lata 350 ml', 1500, 'unidades', 72, 15, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='bebestibles'), 'Agua mineral', 'Botella 500 ml', 1200, 'unidades', 80, 15, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='bebestibles'), 'Jugo natural', 'Vaso 400 ml', 1800, 'unidades', 30, 8, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='bebestibles'), 'Agua Cachantun 1 L', 'Botella individual de un litro', 1800, 'unidades', 24, 6, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='bebestibles'), 'Bebida Express 500 ml', 'Botella individual', 1700, 'unidades', 24, 6, TRUE, TRUE),
  ((SELECT id FROM categories WHERE slug='extras'), 'Empanada de queso', 'Unidad horneada', 1800, 'unidades', 24, 6, TRUE, TRUE)) v(category_id, name, description, price, unit, stock, low_stock_threshold, track_stock, active)
WHERE NOT EXISTS (SELECT 1 FROM products existing WHERE existing.name=v.name) AND NOT EXISTS (SELECT 1 FROM flyway_schema_history WHERE script='R__docker_demo_data.sql' AND success=TRUE);

UPDATE products SET unit_cost = CASE name
  WHEN 'Salmón premium' THEN 2900 WHEN 'Pollo grillado' THEN 1900 WHEN 'Carne mechada' THEN 2800
  WHEN 'Vegetales rostizados' THEN 850 WHEN 'Arroz primavera' THEN 650 WHEN 'Papas rústicas' THEN 800
  WHEN 'Ensalada fresca' THEN 600 WHEN 'Ensalada chilena' THEN 650
  WHEN 'Mousse de chocolate' THEN 1100 WHEN 'Fruta de estación' THEN 600
  WHEN 'Bebida lata' THEN 800 WHEN 'Agua mineral' THEN 550 WHEN 'Jugo natural' THEN 850
  WHEN 'Empanada de queso' THEN 900 ELSE unit_cost END
WHERE name IN ('Salmón premium','Pollo grillado','Carne mechada','Vegetales rostizados','Arroz primavera','Papas rústicas','Ensalada fresca','Ensalada chilena','Mousse de chocolate','Fruta de estación','Bebida lata','Agua mineral','Jugo natural','Empanada de queso');

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
  ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id=ms.menu_id JOIN categories c ON c.id=ms.category_id WHERE m.name='Almuerzo Buffet' AND c.slug='proteinas'), (SELECT id FROM products WHERE name='Pollo grillado'), 0, TRUE),
  ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id=ms.menu_id JOIN categories c ON c.id=ms.category_id WHERE m.name='Almuerzo Buffet' AND c.slug='proteinas'), (SELECT id FROM products WHERE name='Carne mechada'), 1500, TRUE),
  ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id=ms.menu_id JOIN categories c ON c.id=ms.category_id WHERE m.name='Almuerzo Buffet' AND c.slug='proteinas'), (SELECT id FROM products WHERE name='Salmón premium'), 2000, TRUE),
  ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id=ms.menu_id JOIN categories c ON c.id=ms.category_id WHERE m.name='Almuerzo Buffet' AND c.slug='agregados'), (SELECT id FROM products WHERE name='Arroz primavera'), 0, TRUE),
  ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id=ms.menu_id JOIN categories c ON c.id=ms.category_id WHERE m.name='Almuerzo Buffet' AND c.slug='agregados'), (SELECT id FROM products WHERE name='Papas rústicas'), 0, TRUE),
  ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id=ms.menu_id JOIN categories c ON c.id=ms.category_id WHERE m.name='Almuerzo Buffet' AND c.slug='agregados'), (SELECT id FROM products WHERE name='Arroz blanco'), 0, TRUE),
  ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id=ms.menu_id JOIN categories c ON c.id=ms.category_id WHERE m.name='Almuerzo Buffet' AND c.slug='agregados'), (SELECT id FROM products WHERE name='Tallarines con salsa roja'), 0, TRUE),
  ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id=ms.menu_id JOIN categories c ON c.id=ms.category_id WHERE m.name='Almuerzo Buffet' AND c.slug='agregados'), (SELECT id FROM products WHERE name='Tallarines con salsa verde'), 0, TRUE),
  ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id=ms.menu_id JOIN categories c ON c.id=ms.category_id WHERE m.name='Almuerzo Buffet' AND c.slug='agregados'), (SELECT id FROM products WHERE name='Vegetales rostizados'), 500, TRUE),
  ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id=ms.menu_id JOIN categories c ON c.id=ms.category_id WHERE m.name='Almuerzo Buffet' AND c.slug='ensaladas'), (SELECT id FROM products WHERE name='Ensalada fresca'), 0, TRUE),
  ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id=ms.menu_id JOIN categories c ON c.id=ms.category_id WHERE m.name='Almuerzo Buffet' AND c.slug='ensaladas'), (SELECT id FROM products WHERE name='Ensalada chilena'), 0, TRUE),
  ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id=ms.menu_id JOIN categories c ON c.id=ms.category_id WHERE m.name='Almuerzo Buffet' AND c.slug='postres'), (SELECT id FROM products WHERE name='Fruta de estación'), 0, TRUE),
  ((SELECT ms.id FROM menu_sections ms JOIN menus m ON m.id=ms.menu_id JOIN categories c ON c.id=ms.category_id WHERE m.name='Almuerzo Buffet' AND c.slug='postres'), (SELECT id FROM products WHERE name='Mousse de chocolate'), 900, TRUE)
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
INSERT INTO ingredients (name,base_unit,stock,low_stock_threshold,unit_cost,active)
SELECT v.* FROM (VALUES ('Carne de vacuno','G',10000,2000,8.5000,TRUE),('Pechuga de pollo','G',10000,2000,5.5000,TRUE),('Salmón','G',5000,1000,12.0000,TRUE),
('Sal','G',1000,200,0.8000,TRUE),('Zanahoria','G',5000,1000,1.2000,TRUE),('Cebolla','G',5000,1000,1.1000,TRUE),
('Ajo','UNIT',100,20,120.0000,TRUE),('Arroz','G',10000,2000,1.6000,TRUE),('Aceite vegetal','ML',5000,1000,2.2000,TRUE),
('Vegetales mixtos','G',8000,1500,2.5000,TRUE),('Papa','G',12000,2500,1.3000,TRUE),('Romero','G',300,50,8.0000,TRUE),
('Lechuga','G',4000,800,2.2000,TRUE),('Pepino','G',4000,800,1.8000,TRUE),('Tomate','G',8000,1500,2.0000,TRUE),
('Chocolate','G',3000,500,8.0000,TRUE),('Crema','ML',4000,800,3.0000,TRUE),('Azúcar','G',4000,800,1.1000,TRUE),
('Fruta de estación','G',8000,1500,2.2000,TRUE),('Harina','G',10000,2000,1.0000,TRUE),('Queso','G',5000,1000,5.5000,TRUE),
('Tallarines secos','G',10000,2000,1.8000,TRUE),('Salsa de tomate','G',6000,1200,2.3000,TRUE),('Albahaca','G',1000,200,9.0000,TRUE)) v(name,base_unit,stock,low_stock_threshold,unit_cost,active) WHERE NOT EXISTS (SELECT 1 FROM ingredients existing WHERE existing.name=v.name) AND NOT EXISTS (SELECT 1 FROM flyway_schema_history WHERE script='R__docker_demo_data.sql' AND success=TRUE);

INSERT INTO recipes(product_id,yield_quantity,active)
SELECT p.id,v.yield_quantity,TRUE FROM (VALUES
('Salmón premium',4),('Pollo grillado',4),('Carne mechada',4),('Vegetales rostizados',4),('Arroz primavera',8),('Papas rústicas',6),('Arroz blanco',8),('Tallarines con salsa roja',8),('Tallarines con salsa verde',8),
('Ensalada fresca',6),('Ensalada chilena',6),('Mousse de chocolate',6),('Fruta de estación',6),('Empanada de queso',12)
) v(name,yield_quantity) JOIN products p ON p.name=v.name ON CONFLICT (product_id) DO NOTHING;

INSERT INTO recipe_ingredients(recipe_id,ingredient_id,quantity)
SELECT r.id,i.id,v.quantity FROM (VALUES
('Salmón premium','Salmón',800),('Salmón premium','Sal',12),('Salmón premium','Aceite vegetal',20),
('Pollo grillado','Pechuga de pollo',800),('Pollo grillado','Sal',12),('Pollo grillado','Aceite vegetal',20),('Pollo grillado','Ajo',2),
('Carne mechada','Carne de vacuno',1000),('Carne mechada','Sal',6),('Carne mechada','Zanahoria',100),('Carne mechada','Cebolla',100),('Carne mechada','Ajo',2),
('Vegetales rostizados','Vegetales mixtos',1000),('Vegetales rostizados','Aceite vegetal',30),('Vegetales rostizados','Sal',8),
('Arroz primavera','Arroz',1000),('Arroz primavera','Vegetales mixtos',400),('Arroz primavera','Aceite vegetal',30),('Arroz primavera','Sal',12),
('Papas rústicas','Papa',1500),('Papas rústicas','Aceite vegetal',40),('Papas rústicas','Romero',8),('Papas rústicas','Sal',12),
('Arroz blanco','Arroz',1000),('Arroz blanco','Aceite vegetal',20),('Arroz blanco','Sal',12),
('Tallarines con salsa roja','Tallarines secos',1000),('Tallarines con salsa roja','Salsa de tomate',800),('Tallarines con salsa roja','Cebolla',100),('Tallarines con salsa roja','Ajo',2),('Tallarines con salsa roja','Aceite vegetal',20),
('Tallarines con salsa verde','Tallarines secos',1000),('Tallarines con salsa verde','Albahaca',200),('Tallarines con salsa verde','Queso',150),('Tallarines con salsa verde','Ajo',2),('Tallarines con salsa verde','Aceite vegetal',250),
('Ensalada fresca','Lechuga',600),('Ensalada fresca','Pepino',300),('Ensalada fresca','Zanahoria',300),('Ensalada fresca','Aceite vegetal',20),('Ensalada fresca','Sal',8),
('Ensalada chilena','Tomate',900),('Ensalada chilena','Cebolla',500),('Ensalada chilena','Aceite vegetal',20),('Ensalada chilena','Sal',8),
('Mousse de chocolate','Chocolate',300),('Mousse de chocolate','Crema',500),('Mousse de chocolate','Azúcar',100),('Fruta de estación','Fruta de estación',1200),
('Empanada de queso','Harina',1000),('Empanada de queso','Queso',600),('Empanada de queso','Aceite vegetal',100),('Empanada de queso','Sal',20)
) v(product_name,ingredient_name,quantity)
JOIN products p ON p.name=v.product_name JOIN recipes r ON r.product_id=p.id JOIN ingredients i ON i.name=v.ingredient_name
ON CONFLICT (recipe_id,ingredient_id) DO NOTHING;
