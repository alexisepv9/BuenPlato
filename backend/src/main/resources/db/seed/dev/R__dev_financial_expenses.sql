-- Gastos de ejemplo idempotentes para alimentar el tablero financiero local.
MERGE INTO expenses (
    reference_code, expense_date, category, description, expense_type,
    amount, payment_method, created_by, created_at
) KEY(reference_code) VALUES
    ('DEV-ARRIENDO-MES', DATE_TRUNC('MONTH', CURRENT_DATE), 'Arriendo', 'Arriendo mensual del local', 'FIXED', 650000, 'TRANSFER', (SELECT id FROM app_users WHERE email = 'admin@buenplato.cl'), CURRENT_TIMESTAMP),
    ('DEV-SERVICIOS-MES', DATE_TRUNC('MONTH', CURRENT_DATE), 'Servicios', 'Electricidad, agua y gas', 'FIXED', 185000, 'TRANSFER', (SELECT id FROM app_users WHERE email = 'admin@buenplato.cl'), CURRENT_TIMESTAMP),
    ('DEV-INSUMOS-MES', CURRENT_DATE, 'Insumos', 'Envases, servilletas y limpieza', 'VARIABLE', 95000, 'CARD', (SELECT id FROM app_users WHERE email = 'admin@buenplato.cl'), CURRENT_TIMESTAMP);
