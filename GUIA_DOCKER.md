# Buen Plato con Docker

Este entorno ejecuta React/Nginx, Spring Boot y PostgreSQL como servicios
independientes. Nginx es el único punto público y redirige `/api` al backend.

## Cómo leer los comandos de esta guía

Cada comando se presentará con cuatro datos:

1. **Carpeta:** lugar desde el cual debe ejecutarse.
2. **Función:** qué herramienta o framework utiliza y para qué.
3. **Resultado esperado:** cómo saber si funcionó.
4. **Riesgo:** si solo consulta, modifica el entorno o elimina información.

Ejemplo:

```powershell
docker compose ps
```

- **Carpeta:** `C:\Users\Willy\Documents\flujo`
- **Función:** consulta el estado de los servicios definidos en `compose.yaml`.
- **Resultado esperado:** `database`, `backend` y `web` aparecen como activos.
- **Riesgo:** ninguno; es una consulta de solo lectura.

## 1. Preparar variables

En PowerShell, desde la raíz:

```powershell
Copy-Item .env.example .env
```

Edita `.env` y reemplaza `POSTGRES_PASSWORD`.

## 2. Validar y construir

```powershell
docker compose config
docker compose build
```

## 3. Iniciar

```powershell
docker compose up -d
docker compose ps
```

La aplicación queda disponible en `http://localhost`.

## 4. Comprobar cada capa

```powershell
curl.exe http://localhost/healthz
curl.exe http://localhost/api/health
docker compose exec database pg_isready -U buenplato -d buenplato
docker compose logs backend
```

## 5. Ver las tablas

```powershell
docker compose exec database psql -U buenplato -d buenplato
```

Dentro de PostgreSQL:

```sql
\dt
SELECT installed_rank, version, description, success
FROM flyway_schema_history
ORDER BY installed_rank;
\q
```

## 6. Detener sin borrar datos

```powershell
docker compose down
```

El volumen `buenplato_postgres-data` conserva PostgreSQL.

## 7. Borrado total de desarrollo

```powershell
docker compose down -v
```

Este comando elimina definitivamente la base de datos Docker.

## Credenciales de demostración

Las credenciales de demostración se encuentran exclusivamente en
`CUENTAS_LOCALES.md`, un archivo local ignorado por Git.

Estas credenciales pertenecen exclusivamente al perfil `docker` de
demostración y deben reemplazarse antes de publicar el sistema en Internet.
