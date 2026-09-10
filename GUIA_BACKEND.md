# Guía para ejecutar y explorar el backend

## Estado de las migraciones

La primera migración está definida en:

```text
backend/src/main/resources/db/migration/V1__initial_schema.sql
```

Flyway la ejecutará automáticamente cuando Spring Boot se conecte por primera
vez a la base de datos. Después guardará su historial en
`flyway_schema_history`, evitando que la misma migración se aplique dos veces.

## 1. Verificar el equipo

Desde PowerShell, en la raíz del proyecto:

```powershell
.\scripts\check-environment.ps1
```

Se necesita Java 21, Maven 3.9 o superior y Node.js 22 o superior. Docker es
opcional porque el perfil de desarrollo utiliza H2.

## 2. Iniciar el backend

```powershell
.\scripts\start-backend.ps1
```

El comando equivalente ejecutado dentro de `backend` es:

```powershell
mvn -U org.springframework.boot:spring-boot-maven-plugin:4.1.0:run
```

Este comando:

1. Compila el proyecto Java.
2. Inicia Spring Boot.
3. Crea la base H2 local.
4. Ejecuta las migraciones Flyway pendientes.
5. Expone la API en `http://localhost:8080`.

Para comprobar el estado:

```text
http://localhost:8080/api/health
```

## 3. Ver y probar la API con Swagger

Abrir:

```text
http://localhost:8080/swagger-ui.html
```

Swagger muestra los endpoints disponibles. Para probar uno:

1. Seleccionar el endpoint.
2. Pulsar **Try it out**.
3. Completar los datos solicitados.
4. Pulsar **Execute**.
5. Revisar la respuesta y su código HTTP.

## 4. Ver tablas y datos con H2 Console

Abrir:

```text
http://localhost:8080/h2-console
```

Completar:

| Campo | Valor |
|---|---|
| Driver Class | `org.h2.Driver` |
| JDBC URL | `jdbc:h2:file:./data/buenplato` |
| User Name | `sa` |
| Password | Dejar vacío |

Pulsar **Connect**.

### Ver las tablas

Las tablas aparecen en el panel izquierdo. También se puede ejecutar:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Consultar productos

```sql
SELECT *
FROM products
ORDER BY name;
```

### Consultar pedidos

```sql
SELECT order_number, status, payment_status, total, created_at
FROM orders
ORDER BY created_at DESC;
```

### Consultar movimientos de inventario

```sql
SELECT
    p.name,
    m.movement_type,
    m.quantity,
    m.previous_stock,
    m.resulting_stock,
    m.created_at
FROM inventory_movements m
JOIN products p ON p.id = m.product_id
ORDER BY m.created_at DESC;
```

La consola H2 es una herramienta exclusiva de desarrollo. No debe habilitarse
en producción.

## 5. Iniciar React

En una segunda ventana de PowerShell:

```powershell
.\scripts\start-frontend.ps1
```

Abrir:

```text
http://localhost:5173
```

La insignia superior indicará **Conectado** cuando React pueda comunicarse con
Spring Boot.

## 6. Detener el sistema

En cada ventana donde se esté ejecutando un servidor, presionar:

```text
Ctrl + C
```

## 7. PostgreSQL posteriormente

Cuando Docker Desktop esté disponible:

```powershell
docker compose up -d
$env:SPRING_PROFILES_ACTIVE = "prod"
.\scripts\start-backend.ps1
```

Flyway aplicará la misma migración sobre PostgreSQL.
# Acceso al sistema

El frontend utiliza una sesión HTTP administrada por Spring Security.

Usuarios locales: las credenciales de demostración se encuentran exclusivamente
en `CUENTAS_LOCALES.md`, un archivo local ignorado por Git.

Endpoints:

- `POST /api/auth/login`: inicia la sesión.
- `GET /api/auth/me`: devuelve el usuario autenticado.
- `POST /api/auth/logout`: invalida la sesión.

Los usuarios de desarrollo están en
`src/main/resources/db/seed/dev/R__dev_users.sql`. El seeder usa el correo como
clave y no duplica registros.

Para autorizar un frontend externo fuera del perfil local, configura:

```powershell
$env:APP_CORS_ALLOWED_ORIGIN_PATTERNS="https://mi-dominio.cl"
```
