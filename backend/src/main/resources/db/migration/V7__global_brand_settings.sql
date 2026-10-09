-- Una única identidad del negocio, compartida por todas las sesiones.
CREATE TABLE business_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    business_name VARCHAR(80) NOT NULL,
    palette VARCHAR(24) NOT NULL,
    logo_png TEXT,
    revision BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO business_settings (id, business_name, palette) VALUES (1, 'Buen Plato', 'terracotta');
