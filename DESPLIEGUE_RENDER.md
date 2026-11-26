# Despliegue en Render

## Despliegue manual actual (26 de noviembre de 2026)

- Interfaz: `https://buenplato-fronend.onrender.com`.
- Backend: `https://buenplato.onrender.com`.
- En el servicio frontend: raíz `frontend`, Dockerfile `./Dockerfile`,
  contexto `.`, `NGINX_CONF=nginx.render.conf` y `PORT=80`.
- `frontend/nginx.render.conf` reenvía `/api/` al backend anterior.
  Después de cambiarlo, publica el commit y reconstruye el frontend.
- Comprueba `https://buenplato-fronend.onrender.com/api/health`: debe devolver
  JSON con `status: ok`. Un 404 con `x-render-routing: no-server` puede indicar
  que el proxy apunta a un dominio sin servicio.
- En el backend, autoriza el origen exacto de la interfaz mediante
  `APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://buenplato-fronend.onrender.com`;
  conserva otros orígenes necesarios separados por comas. No uses `*`.
- La base H2 temporal en `/tmp` no conserva datos al reemplazar la instancia;
  no utilices este entorno para ventas reales sin almacenamiento persistente.

Los pasos Blueprint de abajo describen una instalación alternativa con otros
nombres y PostgreSQL. No crees servicios duplicados para actualizar el despliegue
manual existente. Si usas el Blueprint, adapta el proxy al dominio asignado.

Render **no ejecuta `compose.yaml`**. El archivo `compose.yaml` sirve para el
computador local; en Render cada contenedor se convierte en un recurso
independiente. La traducción ya está preparada en `render.yaml`:

| Docker Compose | Render |
|---|---|
| `database` (postgres:17) | Render Postgres `buenplato-db` |
| `backend` (Spring Boot) | Web Service Docker `buenplato-api` |
| `web` (Nginx + React) | Web Service Docker `buenplato-web` |

El frontend sigue siendo el único origen que ve el navegador y Nginx reenvía
`/api/*` al backend. Así se mantienen la sesión con cookies y las subidas de
fotos sin depender de CORS entre dominios distintos.

## Archivos que intervienen

- `render.yaml`: define la base de datos y los dos servicios.
- `backend/docker-entrypoint.sh`: convierte la URL de Render
  (`postgresql://...`) al formato JDBC que espera Spring Boot.
- `frontend/nginx.render.conf`: configuración de Nginx para Render. Apunta a
  `https://buenplato.onrender.com` en el despliegue manual actual.
- `frontend/Dockerfile`: el argumento `NGINX_CONF` elige `nginx.conf` en local
  y `nginx.render.conf` en Render.

## Pasos

1. Sube los cambios a GitHub:

   ```powershell
   git add render.yaml .gitattributes backend/Dockerfile backend/docker-entrypoint.sh `
           frontend/Dockerfile frontend/nginx.render.conf DESPLIEGUE_RENDER.md
   git commit -m "chore: preparar despliegue en Render"
   git push origin main
   ```

2. En <https://dashboard.render.com> elige **New > Blueprint** y conecta el
   repositorio `alexisepv9/BuenPlato`.

3. Render detecta `render.yaml` y muestra los tres recursos. Confirma la
   creación. El primer build del backend compila con Maven y puede tardar
   varios minutos.

4. Cuando los servicios estén "Live", comprueba:

   - API: `https://buenplato-api.onrender.com/api/health`
   - Web: `https://buenplato-web.onrender.com`
   - Login de demostración: `admin@buenplato.cl` / `Admin123!`

   Las cuentas demo se cargan porque `SPRING_PROFILES_ACTIVE` incluye el perfil
   `docker`. Son credenciales públicas del repositorio: cámbialas antes de usar
   el sistema con datos reales.

## Si cambias el nombre de los servicios

Render asigna la URL a partir del nombre. Si `buenplato-api` o `buenplato-web`
no quedan disponibles, Render puede agregar un sufijo. En ese caso actualiza:

1. `proxy_pass` en `frontend/nginx.render.conf`.
2. `APP_CORS_ALLOWED_ORIGIN_PATTERNS` en `render.yaml`.

Después haz commit y push; Render vuelve a desplegar automáticamente.

## Limitaciones del plan free

- El backend se **duerme tras 15 minutos sin tráfico**. La primera visita puede
  tardar cerca de un minuto en despertarlo.
- La base de datos free **expira a los 30 días** (hay 14 días de gracia para
  pasarla a pago antes de que Render la elimine).
- El filesystem es efímero: las fotos subidas se pierden en cada reinicio o
  despliegue.
- Hay 750 horas de instancia free por mes para todo el workspace.
- No se admiten discos persistentes ni escalado en el plan free.

### Conservar las fotos

Para que las fotos sobrevivan:

1. Cambia el servicio `buenplato-api` a un plan pago (`starter` o superior).
2. Descomenta el bloque `disk` en `render.yaml`:

   ```yaml
   disk:
     name: buenplato-storage
     mountPath: /app/storage
     sizeGB: 1
   ```

3. Verifica que el usuario `buenplato` del contenedor pueda escribir en
   `/app/storage`; si Render monta el disco con otro propietario, ajusta los
   permisos en el `Dockerfile` o en el entrypoint.

## Paso a producción

- Usa `SPRING_PROFILES_ACTIVE: prod` (sin `,docker`) para no cargar datos demo.
- Crea usuarios administradores propios; el seed de demostración no debe ir a
  producción.
- Cambia las contraseñas demo si vas a conservar esas cuentas.
- Usa un plan pago para la base de datos y para el backend.
- Agrega un dominio propio en Render y actualiza
  `APP_CORS_ALLOWED_ORIGIN_PATTERNS` con ese dominio.

## Actualizaciones

Cada `git push` a la rama conectada vuelve a desplegar los servicios. Si
cambias `compose.yaml`, no afecta a Render: los cambios deben reflejarse en
`render.yaml` o en los Dockerfile.

## El entorno local no cambia

`docker compose up -d` sigue funcionando igual:

- `frontend/Dockerfile` usa `nginx.conf` por defecto.
- `backend/docker-entrypoint.sh` detecta que `DATABASE_URL` ya es JDBC y no la
  modifica.
