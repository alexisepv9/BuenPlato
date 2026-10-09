# Memoria del proyecto — Buen Plato

Selector de fotos: `ProductPhotoEditor` usa React Dropzone con Tailwind y Font Awesome para selección accesible, arrastre, vista previa y reemplazo. Mantiene Axios multipart y almacenamiento local; no incorpora servicios externos ni cambia el MER. Se abre desde «Cambiar foto» en recetas. Priorizar componentes compartidos y bibliotecas adecuadas, conservando una paleta consistente.

Fotos propias de platos disponibles en Ajustar preparación. POST multipart
/api/products/{id}/photo (ADMIN), GET (ADMIN/CASHIER), storage/products/{id}.png.
Validación JPG/PNG, 5 MB, 640×360 mínimo, 4096×4096 máximo; ideal 1280×720.
La foto se guarda independientemente de la receta. No hay migración de esquema.

Impresión interna: `printOrder.ts` genera comprobante cliente y comanda 80 mm
desde GET /api/orders/{id} (ADMIN/CASHIER). No integra SII. Ventana independiente
con selección manual de impresora; no confirma entrega física. Comandas sin precios,
copias marcadas, versión visible si el pedido fue modificado. Prueba: node scripts/test-receipts.mjs.

Edición completa: PUT /api/orders/{id}/content recibe sale y expectedRevision.
Reutiliza cálculo de ventas, compensa movimientos históricos y guarda auditoría V6.
Precios/recetas vigentes, sin integración de devolución bancaria. Notificaciones:
GET /api/notifications filtra en servidor; ADMIN ve stock/ventas, CASHIER sus ventas.

El historial expone la composición original `order_items.selections_json` junto
con los importes guardados. Todas las rutas `/api/orders` requieren ADMIN o CASHIER.
El resumen móvil se abre al incorporar productos o confirmar un buffet configurado.

## Fotos de prueba en ventas

Las tarjetas de menú, opciones y productos usan `DishImage`. La API autenticada
`GET /api/images/demo/{name}` admite únicamente `food` y `fruit`; descarga las
dos muestras de Picsum al necesitarlas y las conserva en `image-storage`.
No sustituye las imágenes de materias primas ni ofrece carga de fotos reales.
Cerrar sesión está disponible desde la cabecera compartida en todos los tamaños.

## Regla de organización y comentarios

El frontend se organiza en `features`, `components`, `types` y `lib`. No agregar
pantallas de negocio dentro de `App.tsx`: éste coordina la aplicación. Cada módulo
debe describir su responsabilidad en la cabecera; comentar decisiones y reglas
no evidentes, evitando repetir literalmente el código. No registrar credenciales
ni cuerpos de solicitudes/respuestas en la consola. Verificar compilación al
extraer componentes y conservar los contratos del backend.

## Regla permanente de documentación

- Cada cambio funcional, visual, de navegación o de permisos debe revisar y actualizar `MANUAL_DE_USUARIO.md` en la misma entrega.
- Cuando el cambio altere una pantalla o un recorrido visible, también deben renovarse las capturas afectadas en `docs/manual/imagenes/`.
- Cada cambio de tablas, relaciones, claves, restricciones, migraciones o reglas de persistencia debe actualizar `MODELO_ENTIDAD_RELACION.md` en la misma entrega.
- Las capturas deben validarse con Google Chrome en viewport móvil de 390 × 844 px y sin mostrar datos privados.
- Ninguna tarea se considera terminada hasta comprobar que el manual y, cuando corresponda, el MER describen el comportamiento real.

> Documento vivo. Debe actualizarse cuando cambie una decisión importante de
> arquitectura, alcance, seguridad, datos o experiencia de usuario.

## 1. Propósito

Buen Plato será un sistema para vender almuerzos configurables al estilo buffet.
Funcionará como una aplicación web adaptable a iPhone, Android, tablet y
escritorio.

El cliente o vendedor podrá construir un almuerzo seleccionando componentes,
añadir productos independientes y registrar el pago. El negocio podrá controlar
menús, precios, pedidos, ventas, usuarios e inventario.

## 2. Alcance funcional acordado

### Venta

- Menú general con precio base dinámico.
- Selección de agregado, proteína, ensalada y postre.
- Productos con recargo dentro de un menú.
- Bebidas, extras y otros productos vendidos por separado.
- Cálculo del precio final en el servidor.
- Registro de método y estado de pago.
- Pedidos para retiro o consumo en el local.
- Estados de preparación del pedido.

### Inventario

- Stock real por materia prima en gramos, mililitros o unidades.
- Umbral configurable de stock bajo.
- Productos disponibles, con poco stock o agotados.
- Movimientos por compra, venta, ajuste, devolución o merma.
- Descuento automático de inventario al confirmar una venta.
- Historial auditable de movimientos.
- Todo alimento preparado requiere una receta antes de venderse. Solo la categoría `Bebestibles` descuenta stock directo por unidad.
- Los seeders agregan datos demostrativos faltantes, pero nunca restauran stock ni sobrescriben recetas ajustadas por el administrador.

### Administración

- Administrador general.
- Cajero.
- Personal de cocina.
- Encargado de inventario.
- Gestión de usuarios y permisos.
- Gestión de productos, categorías, precios y menús.
- Indicadores de ventas, pedidos y stock.

## 3. Arquitectura base

El repositorio se organiza como un monorepositorio:

```text
flujo/
├── backend/          API y reglas de negocio
├── frontend/         Aplicación web React
├── compose.yaml      PostgreSQL para desarrollo
├── .env.example      Variables de entorno documentadas
└── MEMORIA_PROYECTO.md
```

### Backend

- Java 21 LTS.
- Spring Boot.
- Spring Web para la API REST.
- Spring Data JPA e Hibernate.
- Spring Security.
- Bean Validation.
- Flyway para migraciones.
- OpenAPI/Swagger para documentar la API.
- Maven para compilación y dependencias.
- H2 solamente para desarrollo rápido local.
- PostgreSQL como base de datos principal.

### Frontend

- React con TypeScript.
- Vite para desarrollo y compilación.
- Diseño mobile-first.
- Aplicación web responsive; no se desarrollarán dos aplicaciones separadas.
- Comunicación con el backend mediante una API REST bajo `/api`.

## 4. Modelo de datos inicial

El diagrama completo, las cardinalidades y las reglas de integridad están
documentados en [MODELO_ENTIDAD_RELACION.md](MODELO_ENTIDAD_RELACION.md).

Las entidades base son:

- `app_users`: usuarios, roles y estado.
- `categories`: proteína, agregado, ensalada, postre, bebida y extras.
- `products`: catálogo, precio, unidad y stock.
- `menus`: menú configurable y precio base.
- `menu_sections`: reglas de selección por categoría.
- `menu_options`: productos permitidos y recargos.
- `orders`: encabezado, cliente, estado y totales.
- `order_items`: productos o menús vendidos.
- `inventory_movements`: trazabilidad de entradas y salidas.

Los valores monetarios se guardarán como números enteros en pesos chilenos. No
se utilizarán números decimales para representar dinero.

## 5. Buenas prácticas obligatorias

### Principios generales

- Priorizar código claro y mantenible antes que soluciones ingeniosas.
- Aplicar responsabilidad única en clases, componentes y funciones.
- Evitar duplicación, pero no crear abstracciones antes de necesitarlas.
- Usar nombres descriptivos en inglés para el código y español para la interfaz.
- Mantener reglas de negocio en el backend, nunca únicamente en React.
- No confiar en precios, totales, permisos ni stock enviados por el navegador.
- Realizar cambios pequeños y verificables.
- Eliminar código muerto y dependencias sin uso.

### Backend

- Separar controladores, servicios, repositorios, entidades y DTO.
- No exponer entidades JPA directamente desde la API.
- Validar todas las entradas mediante DTO y Bean Validation.
- Centralizar errores con `@ControllerAdvice`.
- Utilizar transacciones para ventas y movimientos de inventario.
- Comprobar nuevamente precio y stock al confirmar un pedido.
- Utilizar migraciones Flyway; no modificar producción con `ddl-auto`.
- Evitar consultas N+1 y añadir índices según los patrones de búsqueda.
- Paginar listados que puedan crecer.
- Usar fechas y horas con zona horaria explícita.
- Documentar los endpoints y sus respuestas.

### Frontend

- TypeScript estricto; evitar `any`.
- Componentes pequeños y reutilizables.
- Separar presentación, acceso a la API y estado.
- Estados visibles de carga, error, vacío y éxito.
- Formularios accesibles y correctamente etiquetados.
- Botones táctiles de al menos 48 píxeles.
- No usar `localStorage` como fuente oficial de pedidos o inventario.
- Diseñar primero para 375 píxeles y ampliar progresivamente.
- Mantener contraste, navegación por teclado y foco visible.

### Base de datos

- Toda modificación de estructura requiere una migración nueva.
- Nunca editar una migración que ya haya sido aplicada en producción.
- Usar claves foráneas, restricciones e índices.
- Conservar un historial de inventario; no limitarse a modificar el stock.
- Las ventas confirmadas deben ser consistentes y transaccionales.
- Definir una estrategia para cancelar pedidos y devolver inventario.

### Seguridad

- Contraseñas almacenadas solamente mediante hash seguro.
- Autorización por roles comprobada en el servidor.
- Secretos y credenciales únicamente en variables de entorno.
- Nunca subir archivos `.env`, claves o contraseñas reales al repositorio.
- Limitar CORS a los orígenes autorizados.
- Validar y normalizar todos los datos recibidos.
- Registrar acciones administrativas importantes.
- No incluir datos sensibles en logs ni mensajes de error.

### Calidad

- Pruebas unitarias para reglas de precio, menús y stock.
- Pruebas de integración para pedidos y persistencia.
- Pruebas del frontend para los flujos críticos.
- Compilación, pruebas y análisis estático antes de integrar cambios.
- No considerar terminada una funcionalidad sin probar errores y casos límite.

## 6. Flujo crítico de una venta

1. El frontend solicita el menú vigente.
2. El usuario selecciona componentes y productos adicionales.
3. El frontend muestra un total estimado.
4. El backend recibe identificadores y cantidades, no un total confiable.
5. El backend consulta los precios y reglas vigentes.
6. El backend valida las selecciones y el stock.
7. Una transacción crea el pedido, sus ítems y movimientos de inventario.
8. El backend devuelve el número de pedido y el total definitivo.
9. Cocina y caja trabajan con el estado persistido del pedido.

## 7. Diseño visual acordado

Dirección: gastronómica, cálida, moderna y cercana.

- Verde oliva oscuro: `#344E41`.
- Verde salvia: `#A3B18A`.
- Crema cálido: `#F7F3E8`.
- Terracota: `#D97745`.
- Amarillo suave: `#F2C76E`.
- Rojo suave: `#C95D63`.
- Carbón: `#25302A`.
- Blanco: `#FFFFFF`.

El diseño definitivo será preparado en Stitch y luego aplicado a los componentes
React.

## 8. Decisiones pendientes

- Nombre comercial definitivo.
- Forma de inicio de sesión.
- Proveedor de pagos electrónicos.
- Impresión de comprobantes o integración con impresora.
- Uso de boleta electrónica e integración tributaria.
- Manejo de múltiples locales.
- Política exacta para cancelaciones y devoluciones.
- Despliegue y proveedor de infraestructura.
- Dominio público.

## 9. Estado actual

- Se eliminó la primera prueba basada solamente en TypeScript.
- Se creó una base nueva para Spring Boot y React.
- Existe una migración inicial del modelo de datos.
- Existe una pantalla React móvil preliminar.
- Existe configuración local para PostgreSQL.
- Falta instalar Java y Maven en el equipo.
- Falta instalar las dependencias del frontend.
- Falta implementar los módulos funcionales del backend.
- Falta aplicar el diseño final de Stitch.

## 10. Próximos pasos recomendados

1. Instalar Java 21 y Maven.
2. Instalar las dependencias React.
3. Ejecutar y verificar frontend, backend y base de datos.
4. Implementar productos y categorías.
5. Implementar menús configurables.
6. Implementar pedidos con transacciones e inventario.
7. Implementar autenticación y permisos.
8. Integrar el diseño entregado por Stitch.
9. Añadir pruebas automatizadas y despliegue continuo.

## 11. Registro de decisiones

| Fecha | Decisión |
|---|---|
| 2026-07-25 | La experiencia será una aplicación web mobile-first para iPhone y Android. |
| 2026-07-25 | React y TypeScript se utilizarán en el frontend. |
| 2026-07-25 | Java con Spring Boot se utilizará en el backend. |
| 2026-07-25 | PostgreSQL será la base de datos principal. |
| 2026-07-25 | Flyway administrará las migraciones. |
| 2026-07-25 | Los precios se almacenarán como enteros en pesos chilenos. |
| 2026-07-25 | Las buenas prácticas descritas en este documento son obligatorias. |
| 2026-07-25 | El MER inicial queda definido en `MODELO_ENTIDAD_RELACION.md`. |
| 2026-07-25 | H2 Console será el visor local de tablas y Swagger permitirá explorar la API. |
| 2026-07-26 | El frontend usa Tailwind CSS, Font Awesome Free y Axios. |
| 2026-07-26 | Se implementaron inventario, categorías y creación de productos de extremo a extremo. |
| 2026-07-26 | El diseño de inventario se renovó con enfoque mobile-first y una interfaz administrativa profesional. |
| 2026-07-26 | Las peticiones usan `X-Request-ID` y registran método, URL, estado y duración para facilitar la depuración. |
| 2026-07-26 | En desarrollo, CORS permite cualquier puerto local de `localhost` y `127.0.0.1`. |
| 2026-07-26 | La identidad visual debe mantenerse alineada con Stitch: Manrope, crema `#F7F3E8`, verde oliva `#344E41`, salvia `#A3B18A` y terracota `#D97745`. |
| 2026-07-26 | La navegación principal queda definida como Venta, Inventario y Finanzas. |
| 2026-07-26 | El encabezado estándar debe mostrar el nombre del local `Buen Plato` y el contexto `Buffet digital`. |
| 2026-07-26 | En escritorio se usará navegación lateral y en dispositivos móviles una barra inferior persistente. |
| 2026-07-26 | Los productos del inventario pueden editarse y eliminarse desde escritorio o móvil. |
| 2026-07-26 | La eliminación de productos será una baja lógica para conservar el historial de pedidos y movimientos. |
| 2026-07-26 | Los indicadores de Productos activos, Stock bajo y Agotados funcionan como filtros del inventario. |
| 2026-07-26 | La paleta visual evoluciona a una identidad gastronómica más colorida y profesional. Esta decisión reemplaza la paleta anterior. |
| 2026-07-26 | Nueva paleta: verde hierbas `#2F5D50`, paprika `#E45C3A`, azafrán `#F2B544`, aguacate `#7FA35C`, crema `#FFF8EC`, frutos rojos `#9A4965`, aqua `#4C93A6` y carbón `#24302B`. |
| 2026-07-26 | Las categorías y estados de inventario deben utilizar acentos diferenciados, manteniendo el verde como color estructural. |
| 2026-07-26 | La interfaz no debe sentirse plana ni como una plantilla genérica: se utilizarán capas, gradientes controlados, transparencias, sombras y composiciones asimétricas. |
| 2026-07-26 | El inventario incorpora un panel de salud general para comunicar disponibilidad y alertas de forma inmediata. |
| 2026-07-27 | Una línea de venta puede agrupar varios menús buffet mediante `order_items.quantity`. |
| 2026-07-27 | Cada opción de proteína, agregado, ensalada y postre guarda su propia cantidad en `selections_json`; por ejemplo, 3 menús pueden distribuirse en 2 pollos y 1 carne. |
| 2026-07-27 | La suma de opciones por sección debe escalar con la cantidad de menús y el resumen muestra una sola línea editable, sin repetir configuraciones. |
| 2026-07-27 | Venta comienza como catálogo: el configurador buffet se abre solamente al pulsar `Configurar menú` y se cierra al guardarlo o cancelarlo. |
| 2026-07-27 | Proteínas, agregados, ensaladas, postres, bebidas y extras también se pueden vender directamente como productos individuales. |
| 2026-07-27 | El carrito permite agregar varios grupos de menú, cada uno con su cantidad y distribución propias, y luego editarlos o quitarlos. |
| 2026-07-27 | El inicio de Venta presenta dos tarjetas equivalentes: `Almuerzo Buffet` abre el configurador y `Producto individual` abre el catálogo de productos sueltos. |
| 2026-07-28 | Venta adopta una apariencia más luminosa basada en crema, azafrán y paprika; se reducen los bloques oscuros del encabezado y del resumen. |
| 2026-07-28 | En móvil, el resumen del pedido funciona como una barra flotante sobre el contenido y encima de la navegación inferior; al pulsarla se expande como panel superpuesto. |
| 2026-07-28 | El selector de cantidad de menús utiliza controles táctiles de mayor tamaño y ocupa todo el ancho disponible en pantallas pequeñas. |
| 2026-07-28 | Se implementa autenticación por sesión HTTP con login JSON, consulta del usuario actual y cierre de sesión. La API devuelve `401` cuando no existe una sesión válida. |
| 2026-07-28 | Los usuarios se cargan mediante el seeder repetible `db/seed/dev/R__dev_users.sql`, usando `MERGE ... KEY(email)` para evitar duplicados. |
| 2026-07-28 | Se definieron usuarios demo con roles `ADMIN` y `CASHIER`; sus credenciales se conservan únicamente en `CUENTAS_LOCALES.md`, excluido de Git. |
| 2026-07-28 | Las contraseñas se almacenan como hashes BCrypt; nunca se guardan en texto plano en `app_users`. |
| 2026-07-28 | En perfil `dev`, CORS admite el origen del dispositivo móvil en la red local y utiliza credenciales. En otros perfiles se restringe mediante `APP_CORS_ALLOWED_ORIGIN_PATTERNS`. |
| 2026-07-28 | Las ventas autenticadas guardan el usuario responsable en `orders.created_by`. |
| 2026-07-28 | El catálogo demostrativo utiliza claves naturales (`slug`, `sku`, nombre de menú y relaciones) con `MERGE`, evitando registros duplicados al repetir Flyway. |
| 2026-07-28 | Finanzas consume exclusivamente `/api/finance/dashboard`; React no contiene indicadores financieros simulados. |
| 2026-07-28 | La migración V3 agrega costo unitario de productos, costo histórico de cada venta y gastos operacionales fijos/variables. |
| 2026-07-28 | Los indicadores incluyen ventas, pedidos, ticket promedio, costo de alimentos, margen bruto, gastos, resultado operacional, punto de equilibrio, inventario valorizado y mermas. |
| 2026-07-28 | El análisis incorpora ventas diarias, demanda por hora, mezcla por categoría, contribución por producto, riesgo de stock y comparación con el período anterior. |
| 2026-07-28 | Los reportes financieros se generan en el backend como PDF y Excel reales, respetando el rango de fechas seleccionado. |
| 2026-07-27 | Las bebidas se cobran aparte y cualquier producto activo puede agregarse como extra de la venta. |
| 2026-07-27 | Las migraciones permanentes viven en `db/migration` y los datos demostrativos del perfil local en `db/seed/dev`. |
| 2026-07-27 | La creación del pedido, sus ítems y los movimientos de inventario se ejecutan en una única transacción. |
| 2026-07-30 | Toda instrucción de terminal debe indicar carpeta de ejecución, finalidad del comando, resultado esperado y advertencia cuando modifica o elimina datos. |
| 2026-07-30 | Durante las implementaciones se explicará al usuario qué archivo, clase, función o configuración se está modificando y cómo participa en el flujo general. |
| 2026-07-30 | Los archivos nuevos deben comenzar con una descripción breve de su responsabilidad; las clases y funciones principales deben documentar su propósito y las reglas de negocio no evidentes. |
| 2026-07-30 | Los comentarios deben enseñar el porqué de la implementación y no repetir literalmente lo que ya expresa el código. |
| 2026-09-10 | Todo producto preparado debe tener receta; una venta sin receta se bloquea. Solo `Bebestibles` usa inventario directo por unidad. |
| 2026-09-10 | Los seeders de inventario y recetas son aditivos e idempotentes: no sobrescriben existencias, rendimientos ni componentes ajustados. |
