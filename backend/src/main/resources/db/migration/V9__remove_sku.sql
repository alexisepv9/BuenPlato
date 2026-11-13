-- Los vínculos ya usan el ID. No se modifican productos, stock, recetas ni ventas.
ALTER TABLE products DROP COLUMN sku;
ALTER TABLE ingredients DROP COLUMN sku;
