-- Usuarios de desarrollo idempotentes con contraseñas BCrypt.
MERGE INTO app_users (
    email, display_name, password_hash, role, active, created_at
) KEY(email) VALUES
    (
        'admin@buenplato.cl',
        'Administrador Buen Plato',
        '$2a$10$9VD9G40O7bT4UfzKRmocFe2WGS8WRr2PT6J3oT0MHA5Adm4KXFiYa',
        'ADMIN',
        TRUE,
        CURRENT_TIMESTAMP
    ),
    (
        'caja@buenplato.cl',
        'Caja Buen Plato',
        '$2a$10$0pL/Xm1225AKyyE4CsHsOOqYPv3rqQ3ZMwJc9KIs9eCu5I/QCxi4q',
        'CASHIER',
        TRUE,
        CURRENT_TIMESTAMP
    );
