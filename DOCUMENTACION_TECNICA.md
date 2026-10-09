# Documentación técnica — Buen Plato

## Organización del frontend

- `App.tsx`: sesión, navegación y carga compartida.
- `features/auth/LoginView.tsx`: acceso y visibilidad de contraseña.
- `features/inventory/RawInventoryView.tsx`: materias primas y recetas.
- `features/catalog/CatalogViews.tsx`: formularios de productos vendibles.
- `features/sales/SalesView.tsx`: pedido buffet, resumen e historial.
- `features/finance/FinanceView.tsx`: indicadores, gastos y exportaciones.
- `components/AppShell.tsx`: cabecera y navegación responsive.
- `components/ui.tsx`: controles compartidos sin llamadas a la API.
- `types/domain.ts`: contratos de datos compartidos, importados con `import type`.
- `lib/presentation.ts`: moneda y apariencia de campos.
- `lib/api.ts`: transporte Axios, identificador de solicitud y errores.

Los comentarios explican responsabilidades e invariantes. Evitar comentarios que
repitan cada instrucción. Al depurar, partir del módulo afectado y correlacionar
las solicitudes mediante `X-Request-ID`; los logs del cliente no imprimen cuerpos,
parámetros ni respuestas que puedan contener credenciales o datos personales.

Las materias primas incluyen `imageUrl` opcional en la API, persistido por V5
en `ingredients.image_url`. Bean Validation limita el enlace a HTTPS y 2048
caracteres. El navegador carga la imagen sin Referer, con carga diferida y
alternativa visual cuando falla. El backend no descarga recursos externos.

## 1. Propósito y alcance

Buen Plato es una aplicación web adaptable para administrar ventas de almuerzos buffet, productos individuales, existencias y análisis financiero de un local de alimentos.

## 2. Tecnologías

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, Axios y Motion.
- Backend: Java 21, Spring Boot 4.1, Spring Web, Security, Validation y Data JPA.
- Datos: PostgreSQL 17 en Docker; H2 en desarrollo local.
- Migraciones: Flyway.
- Reportes: Apache POI para Excel y OpenPDF para PDF.
- Entrega: Nginx y Docker Compose.

## 3. Arquitectura

```text
Navegador
  -> Nginx :80
      -> archivos React
      -> /api/* -> Spring Boot :8080
                      -> JPA / JdbcTemplate
                          -> PostgreSQL :5432
```

En Compose, backend y PostgreSQL permanecen en la red privada `internal`. Solo Nginx publica el puerto web. PostgreSQL se enlaza a `127.0.0.1` para administración local y no a todas las interfaces.

## 4. Módulos del backend

- `auth`: autenticación persistida y sesiones HTTP.
- `catalog`: categorías, productos, filtros y stock.
- `inventory`: materias primas, conversiones de unidad y recetas.
- `sales`: catálogo buffet, pedidos, historial y movimientos de inventario.
- `finance`: indicadores, gastos y reportes.
- `config`: seguridad y CORS.
- `shared`: healthcheck, trazabilidad y respuestas de error.

Flujo de una solicitud:

```text
Controller -> DTO validado -> Service transaccional -> Repository/JdbcTemplate -> Base de datos
```

Los controladores traducen HTTP; los servicios concentran reglas de negocio; los DTO definen los contratos; repositorios y `JdbcTemplate` persisten datos.

## 5. API implementada

| Método | Ruta | Descripción | Sesión |
|---|---|---|:---:|
| GET | `/api/health` | Salud básica del servicio | No |
| POST | `/api/auth/login` | Autentica y crea sesión | No |
| GET | `/api/auth/me` | Devuelve usuario actual | Sí |
| POST | `/api/auth/logout` | Invalida sesión | Sí |
| GET | `/api/categories` | Categorías activas | Sí |
| GET | `/api/products` | Productos paginados y filtrados | Sí |
| POST | `/api/products` | Crea producto | Sí |
| PUT | `/api/products/{id}` | Actualiza producto | Sí |
| DELETE | `/api/products/{id}` | Desactiva producto | Sí |
| GET | `/api/ingredients` | Lista y filtra materias primas | Sí |
| POST | `/api/ingredients` | Crea materia prima | Sí |
| PUT | `/api/ingredients/{id}` | Actualiza materia prima | Sí |
| DELETE | `/api/ingredients/{id}` | Desactiva materia prima sin receta | Sí |
| GET | `/api/recipes` | Lista recetas y costos por porción | Sí |
| PUT | `/api/products/{id}/recipe` | Crea o reemplaza la receta de un plato | Sí |
| GET | `/api/sales/catalog` | Menús y productos adicionales | Sí |
| POST | `/api/orders` | Registra pedido transaccional | Sí |
| GET | `/api/orders` | Historial de pedidos | Sí |
| PUT | `/api/orders/{id}` | Actualiza metadatos del pedido | Sí |
| GET | `/api/finance/dashboard` | Panel financiero por fechas | Sí |
| POST | `/api/finance/expenses` | Registra gasto | Sí |
| GET | `/api/finance/reports/pdf` | Descarga PDF | Sí |
| GET | `/api/finance/reports/excel` | Descarga Excel | Sí |

`GET /api/products` admite `search`, `category`, `status`, `page` y `size`. El tamaño está limitado a 100. Las rutas financieras aceptan `from` y `to` ISO (`AAAA-MM-DD`) y un máximo de 366 días.

## 6. Autenticación y autorización

Spring Security autentica contra `app_users`, valida hashes BCrypt y conserva el contexto en una sesión HTTP. Axios usa `withCredentials: true` para enviar la cookie.

Rutas públicas: health, login, Actuator health y OpenAPI/Swagger. El resto requiere autenticación.

La autorización se aplica en backend: `ROLE_ADMIN` administra materias primas, preparaciones, productos y finanzas; `ROLE_CASHIER` puede consultar el catálogo y operar ventas. La interfaz replica esta matriz para orientar al usuario, pero el servidor sigue siendo la autoridad. `ADMIN` siempre conserva acceso total.

## 7. Modelo de datos

Tablas principales:

- `app_users`: usuarios, rol, hash y estado.
- `categories`: clasificación de productos.
- `products`: catálogo, precios, costos y existencias.
- `menus`: definiciones de menú buffet.
- `menu_sections`: proteína, agregado, ensalada, postre u otras secciones.
- `menu_options`: productos seleccionables y recargos.
- `orders`: cabecera de venta.
- `order_items`: líneas, cantidades, precios y costos históricos.
- `inventory_movements`: trazabilidad de entradas, salidas y mermas.
- `ingredients`: materia prima normalizada en gramos, mililitros o unidades.
- `recipes`: rendimiento de la preparación asociada a un producto.
- La interfaz de nueva preparación crea primero el producto de catálogo con un
  SKU técnico automático y luego registra su receta. Para productos ya
  existentes sin receta reutiliza su identificador, evitando duplicarlos.
- La edición de materias primas convierte las unidades base persistidas (`G` y
  `ML`) a unidades de captura cómodas (`KG` y `L`). Antes de enviar la petición,
  el backend normaliza nuevamente cantidad, umbral y costo a la unidad base.
- En resoluciones móviles, `AppShell` usa una columna de `100dvh`: header y nav
  ocupan espacio propio y sólo `main` tiene desplazamiento vertical. Esto evita
  superposición global y añade soporte para `safe-area-inset-bottom`.
- El perfil Docker admite CORS con credenciales desde `http://localhost`,
  `http://127.0.0.1` y `https://*.trycloudflare.com`. El patrón limitado permite
  probar sesiones a través de Quick Tunnel sin habilitar todos los orígenes.
- El interceptor Axios transforma respuestas `401` (excepto la comprobación
  inicial y el propio login) en un evento global de sesión vencida. `App`
  desmonta las vistas privadas, vuelve al acceso y muestra un aviso comprensible.
- `LoginView` mantiene localmente `showPassword` y alterna el tipo del campo
  entre `password` y `text`. El control expone `aria-label` y `aria-pressed` para
  lectores de pantalla y no altera la credencial escrita.
- El resumen móvil de ventas utiliza una separación inferior explícita de 88 px
  más `safe-area-inset-bottom`, aplicada como estilo CSS compatible con Chrome
  móvil. Su altura máxima descuenta cabecera y nav; overlay, disparador y panel
  de cobro no invaden el espacio de navegación.
- `recipe_ingredients`: composición del lote de una receta.

`SalesService.discountRequirements` clasifica el inventario por categoría. `bebestibles` conserva descuento unitario en `products`; cualquier otra categoría exige receta y calcula el consumo proporcional en `ingredients`. La ausencia de receta produce un error de negocio y revierte la transacción completa.

Los seeders repetibles usan inserción condicional/`ON CONFLICT DO NOTHING`: añaden materias primas, platos, recetas o componentes faltantes sin restaurar existencias ni sobrescribir cambios administrativos.

`DELETE /api/ingredients/{id}` realiza una baja lógica (`active=false`). Antes verifica referencias en `recipe_ingredients`; las bloquea para impedir recetas incompletas y conserva movimientos históricos.

React centraliza los avisos operativos mediante `FloatingAlert`: usa `role="alert"`, animación, tono semántico, cierre manual y ocultamiento automático a los cinco segundos. Las validaciones contextuales de formularios no se convierten en toast porque deben permanecer junto a la decisión requerida.
- `ingredient_movements`: trazabilidad del consumo real de materias primas.
- `expenses`: gastos fijos y variables.

La especificación completa se encuentra en `MODELO_ENTIDAD_RELACION.md`.

## 8. Migraciones y datos iniciales

Flyway ejecuta `db/migration/V*` en orden y registra cada versión. Una migración aplicada no se modifica: el siguiente cambio debe ser `V4__descripcion.sql`, luego `V5`, etc.

Los seeders repetibles están separados por entorno:

- `db/seed/dev`: H2 local.
- `db/seed/docker`: PostgreSQL de demostración.

Los seeders actuales son idempotentes y evitan duplicados mediante claves naturales. No deben contener credenciales definitivas de producción.

## 9. Docker

Servicios:

| Servicio | Responsabilidad | Exposición |
|---|---|---|
| `web` | Nginx y React; proxy `/api` | Puerto 80 |
| `backend` | Spring Boot | Solo red Docker |
| `database` | PostgreSQL y volumen persistente | Solo `127.0.0.1:5432` |

Operaciones desde la raíz:

```bash
docker compose up -d
docker compose ps
docker compose logs -f backend
docker compose up -d --build
docker compose down
```

`docker compose down` conserva el volumen. `docker compose down -v` elimina la base persistente y solo debe usarse cuando se desea borrar expresamente todos sus datos.

## 10. Configuración y secretos

- `.env.example` contiene nombres y ejemplos documentables.
- `.env` contiene valores locales y está ignorado por Git.
- `CUENTAS_LOCALES.md` contiene accesos demo y está ignorado.
- Claves `.pem`, `.key`, `.p12` y `.jks` están ignoradas.

No registrar secretos en código, documentación versionada, logs, imágenes Docker ni historial Git. En producción, usar un almacén de secretos y rotación de credenciales.

## 11. Observabilidad y errores

`RequestTraceFilter` asigna `X-Request-ID`, mide duración y registra método, ruta y estado. El frontend genera y registra el mismo identificador durante desarrollo. `ApiExceptionHandler` devuelve errores JSON coherentes con fecha, estado, mensaje, ruta e identificador.

Diagnóstico recomendado:

```bash
docker compose ps
docker compose logs --tail 200 backend
curl http://localhost/api/health
```

## 12. Respaldo y recuperación

Antes de producción se debe automatizar `pg_dump`, cifrar copias, almacenarlas fuera del servidor y probar restauraciones. Un volumen Docker persistente evita perder datos al recrear contenedores, pero no reemplaza un respaldo.

## 13. Lista previa a producción

- Reemplazar o retirar cuentas demo.
- Implementar permisos por rol y pruebas de autorización.
- Reactivar protección CSRF o adoptar un mecanismo equivalente apropiado para sesiones.
- Configurar HTTPS y cookies seguras.
- Restringir CORS al dominio definitivo.
- Agregar limitación de intentos de login.
- Automatizar backups y restauración.
- Centralizar secretos.
- Incorporar pruebas de integración de ventas, stock y reportes.
- Monitorear disponibilidad, almacenamiento y errores.

## 14. Publicación responsable en Git

Se incluyen código fuente, migraciones, seeders de demostración, Dockerfiles, Compose, configuración de ejemplo y documentación pública. Se excluyen secretos, dependencias, compilados, datos persistentes, herramientas locales y archivos temporales.

Antes de cada publicación:

```bash
git status --short
git diff --cached
git ls-files
```

El responsable debe revisar que ningún archivo privado aparezca en las salidas antes de hacer `git push`.

## 15. Definición de terminado para cambios

Todo cambio funcional, visual, de navegación o autorización debe incluir:

1. Pruebas proporcionales al riesgo del cambio.
2. Revisión y actualización de `MANUAL_DE_USUARIO.md`.
3. Renovación de las imágenes afectadas en `docs/manual/imagenes/` cuando cambie la interfaz.
4. Actualización de `MODELO_ENTIDAD_RELACION.md` cuando cambien tablas, relaciones, claves, restricciones, migraciones o persistencia.
5. Validación en Google Chrome con viewport móvil de 390 × 844 px.
6. Confirmación de que la documentación no contiene contraseñas, sesiones ni datos privados.
