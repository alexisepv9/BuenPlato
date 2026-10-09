-- Catálogo culinario de desarrollo. Inserta faltantes sin sobrescribir ajustes del administrador.
INSERT INTO ingredients (sku,name,base_unit,stock,low_stock_threshold,unit_cost,active)
SELECT v.sku,v.name,v.unit,v.stock,v.threshold,v.cost,TRUE FROM (VALUES
('MP-CARNE','Carne de vacuno','G',10000,2000,8.5000),('MP-POLLO','Pechuga de pollo','G',10000,2000,5.5000),('MP-SALMON','Salmón','G',5000,1000,12.0000),
('MP-SAL','Sal','G',1000,200,0.8000),('MP-ZANAHORIA','Zanahoria','G',5000,1000,1.2000),('MP-CEBOLLA','Cebolla','G',5000,1000,1.1000),
('MP-AJO','Ajo','UNIT',100,20,120.0000),('MP-ARROZ','Arroz','G',10000,2000,1.6000),('MP-ACEITE','Aceite vegetal','ML',5000,1000,2.2000),
('MP-VEGETALES','Vegetales mixtos','G',8000,1500,2.5000),('MP-PAPA','Papa','G',12000,2500,1.3000),('MP-ROMERO','Romero','G',300,50,8.0000),
('MP-LECHUGA','Lechuga','G',4000,800,2.2000),('MP-PEPINO','Pepino','G',4000,800,1.8000),('MP-TOMATE','Tomate','G',8000,1500,2.0000),
('MP-CHOCOLATE','Chocolate','G',3000,500,8.0000),('MP-CREMA','Crema','ML',4000,800,3.0000),('MP-AZUCAR','Azúcar','G',4000,800,1.1000),
('MP-FRUTA','Fruta de estación','G',8000,1500,2.2000),('MP-HARINA','Harina','G',10000,2000,1.0000),('MP-QUESO','Queso','G',5000,1000,5.5000),
('MP-PASTA','Tallarines secos','G',10000,2000,1.8000),('MP-SALSA-TOMATE','Salsa de tomate','G',6000,1200,2.3000),('MP-ALBAHACA','Albahaca','G',1000,200,9.0000)
) v(sku,name,unit,stock,threshold,cost) WHERE NOT EXISTS (SELECT 1 FROM ingredients i WHERE i.sku=v.sku);

INSERT INTO recipes(product_id,yield_quantity,active)
SELECT p.id,v.yield_quantity,TRUE FROM (VALUES
('PRO-001',4),('PRO-010',4),('PRO-011',4),('AGR-001',4),('AGR-010',8),('AGR-011',6),('AGR-012',8),('AGR-013',8),('AGR-014',8),
('ENS-010',6),('ENS-011',6),('POS-001',6),('POS-010',6),('EXT-010',12)
) v(sku,yield_quantity) JOIN products p ON p.sku=v.sku WHERE NOT EXISTS (SELECT 1 FROM recipes r WHERE r.product_id=p.id);

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
WHERE NOT EXISTS (SELECT 1 FROM recipe_ingredients ri WHERE ri.recipe_id=r.id AND ri.ingredient_id=i.id);
