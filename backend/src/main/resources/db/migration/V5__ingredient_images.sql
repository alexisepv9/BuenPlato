-- Imagen opcional del inventario; conserva las existencias y recetas actuales.
ALTER TABLE ingredients ADD COLUMN image_url VARCHAR(2048);
