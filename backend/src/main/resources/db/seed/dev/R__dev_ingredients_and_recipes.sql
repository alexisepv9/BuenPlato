-- Catálogo culinario de desarrollo. Inserta faltantes sin sobrescribir ajustes del administrador.
INSERT INTO ingredients (name,base_unit,stock,low_stock_threshold,unit_cost,active)
SELECT v.name,v.unit,v.stock,v.threshold,v.cost,TRUE FROM (VALUES
('Carne de vacuno','G',10000,2000,8.5000),('Pechuga de pollo','G',10000,2000,5.5000),('Salmón','G',5000,1000,12.0000),
('Sal','G',1000,200,0.8000),('Zanahoria','G',5000,1000,1.2000),('Cebolla','G',5000,1000,1.1000),
('Ajo','UNIT',100,20,120.0000),('Arroz','G',10000,2000,1.6000),('Aceite vegetal','ML',5000,1000,2.2000),
('Vegetales mixtos','G',8000,1500,2.5000),('Papa','G',12000,2500,1.3000),('Romero','G',300,50,8.0000),
('Lechuga','G',4000,800,2.2000),('Pepino','G',4000,800,1.8000),('Tomate','G',8000,1500,2.0000),
('Chocolate','G',3000,500,8.0000),('Crema','ML',4000,800,3.0000),('Azúcar','G',4000,800,1.1000),
('Fruta de estación','G',8000,1500,2.2000),('Harina','G',10000,2000,1.0000),('Queso','G',5000,1000,5.5000),
('Tallarines secos','G',10000,2000,1.8000),('Salsa de tomate','G',6000,1200,2.3000),('Albahaca','G',1000,200,9.0000)
) v(name,unit,stock,threshold,cost) WHERE NOT EXISTS (SELECT 1 FROM ingredients existing WHERE existing.name=v.name) AND NOT EXISTS (SELECT 1 FROM flyway_schema_history WHERE script='R__dev_ingredients_and_recipes.sql' AND success=TRUE);

INSERT INTO recipes(product_id,yield_quantity,active)
SELECT p.id,v.yield_quantity,TRUE FROM (VALUES
('Salmón premium',4),('Pollo grillado',4),('Carne mechada',4),('Vegetales rostizados',4),('Arroz primavera',8),('Papas rústicas',6),('Arroz blanco',8),('Tallarines con salsa roja',8),('Tallarines con salsa verde',8),
('Ensalada fresca',6),('Ensalada chilena',6),('Mousse de chocolate',6),('Fruta de estación',6),('Empanada de queso',12)
) v(name,yield_quantity) JOIN products p ON p.name=v.name WHERE NOT EXISTS (SELECT 1 FROM recipes r WHERE r.product_id=p.id);

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
WHERE NOT EXISTS (SELECT 1 FROM recipe_ingredients ri WHERE ri.recipe_id=r.id AND ri.ingredient_id=i.id);
