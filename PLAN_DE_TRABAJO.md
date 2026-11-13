# Plan de trabajo y seguimiento del sistema

Fecha de revisión: 12 de noviembre de 2026.

## 1. Alcance y cómo usar este documento

Este plan descompone todos los módulos del documento de requisitos entregado por el cliente y conserva las funcionalidades ya desarrolladas. Es un inventario de trabajo, no una certificación de que el sistema funciona en producción.

La evaluación se basa en lectura de controladores, servicios, migraciones y pantallas. En esta revisión no se ejecutaron pruebas funcionales ni se modificó la aplicación. Las tareas implementadas también necesitan validación, pruebas de regresión y mejoras.

Estados:

- **Base:** existe una implementación identificable; falta validar su recorrido completo.
- **Parcial:** existe una parte, pero no satisface todo el requisito.
- **Pendiente:** no se encontró implementación del alcance indicado.
- **Definir:** requiere una decisión de negocio antes de implementar.
- **Validado:** reservado para tareas con evidencia de pruebas y aceptación. Ninguna tarea recibe este estado solo por tener código.

Prioridades: **P0** integridad de datos, accesos y decisiones bloqueantes; **P1** operación principal; **P2** mejoras y entregables complementarios. Los identificadores son permanentes: podemos trabajar diciendo, por ejemplo, «continuemos con INS-02».

Cada tarea debe terminar con backend cuando corresponda, interfaz adaptable, validación de permisos, mensajes claros, pruebas, documentación y MER si cambia la persistencia. No se eliminarán módulos existentes para empezar de cero.

## 2. Decisiones necesarias

| ID | Prioridad | Decisión | Propuesta inicial, pendiente de aprobación |
|---|---|---|---|
| DEC-01 | P0 | Qué puede hacer un Cliente | No habilitar acceso hasta definir si consulta carta, pide, consulta historial o paga. No confundir cliente de una venta con cuenta autenticada. |
| DEC-02 | P0 | Venta sin stock | Confirmación Sí/No con faltantes detallados, permiso especial, motivo y auditoría. Definir si se admite saldo negativo o se corrige primero la existencia; nunca asumirlo silenciosamente. |
| DEC-03 | P0 | Cuándo afecta stock un pedido de mesa | El documento pide descontar al cobrar. Evaluar reserva al confirmar/enviar a cocina para impedir vender el mismo stock en otras cajas. Al cerrar se consume la reserva, sin doble descuento. |
| DEC-04 | P0 | Eliminar ventas | Proponer anulación trazable, no borrado físico. Definir devolución de dinero y si lo ya preparado vuelve a stock o se registra como merma. |
| DEC-05 | P1 | Roles y restricciones | Administrador con acceso completo; perfiles iniciales Cajero, Garzón, Cocina y Barra. Resolver qué tareas se delegan: el acuerdo anterior reservaba recetas y preparación al administrador. |
| DEC-06 | P1 | Entrega y datos del cliente | Aclarar si `address`, `mail`, `number` son despacho, correo y teléfono; qué campos son opcionales y si existe reparto. |
| DEC-07 | P1 | Propina y pagos | Separar propina de ingreso por venta. Definir pagos divididos, redondeos y si «validar pago» es registro manual o integración bancaria. |
| DEC-08 | P1 | Cambios después de enviar a cocina | Enviar diferencias y cancelaciones, sin duplicar la comanda ni perder lo que ya se está preparando. |
| DEC-09 | P2 | Notificaciones diarias | Distinguir aviso por cambio de stock, listado persistente de críticos y resumen diario; definir cuándo repetir y quién lo recibe. |

## 3. Usuarios, inicio de sesión y trabajadores

| ID | Estado | Prioridad | Tarea y criterio de aceptación |
|---|---|---|---|
| USR-01 | Base | P0 | Validar login con correo y contraseña, `/auth/me` y logout: credenciales erróneas, sesión vencida y salida no dejan acceso activo. |
| USR-02 | Parcial | P0 | Revisar seguridad de sesiones, contraseñas, CORS y CSRF; comprobar localhost y HTTPS. Respuestas no revelan contraseñas ni información interna. |
| USR-03 | Pendiente | P1 | Listado, búsqueda y detalle de trabajadores; mostrar nombre, correo, rol y estado sin exponer hashes. |
| USR-04 | Pendiente | P1 | Crear y editar trabajador; correo único y válido, nombre obligatorio y rol existente. El requisito de trabajadores debe incluir correo para poder iniciar sesión. |
| USR-05 | Pendiente | P0 | Desactivar/reactivar trabajador y revocar acceso efectivo; impedir dejar el sistema sin administrador activo. Mantener autoría de ventas históricas. |
| USR-06 | Pendiente | P1 | Cambio/restablecimiento de contraseña con controles y auditoría; no almacenar ni mostrar contraseñas en texto plano. |
| USR-07 | Pendiente | P2 | Exportar trabajadores a Excel y PDF con filtros y permisos; excluir contraseñas y hashes. |
| USR-08 | Definir | P1 | Diseñar el perfil Cliente después de DEC-01; documentar datos y funciones antes de crear pantallas. |

## 4. Roles y permisos

| ID | Estado | Prioridad | Tarea y criterio de aceptación |
|---|---|---|---|
| ROL-01 | Base | P0 | Verificar restricciones actuales ADMIN/CASHIER en servidor y menú; ocultar botones no reemplaza autorización HTTP. |
| ROL-02 | Pendiente | P1 | CRUD de roles con nombre único, fechas y reglas para roles asignados; no permitir retirar o degradar el administrador protegido. |
| ROL-03 | Pendiente | P0 | Persistir matriz rol–módulo–acción: ver, crear, editar y eliminar; incluir acciones especiales como anular, cobrar, exportar y autorizar faltantes. |
| ROL-04 | Pendiente | P1 | Editor visual de permisos por rol; guardar de forma atómica y explicar dependencias entre acciones. |
| ROL-05 | Pendiente | P0 | Aplicar permisos a cada endpoint y cargar navegación/botones desde permisos efectivos; cambios de permisos deben afectar sesiones activas. |
| ROL-06 | Pendiente | P0 | Pruebas de denegación por rol y por acción; acceso directo a una URL o llamada manual no permite eludir permisos. |

## 5. Categorías de insumos e insumos

| ID | Estado | Prioridad | Tarea y criterio de aceptación |
|---|---|---|---|
| INS-01 | Pendiente | P1 | CRUD de categorías de insumos: nombre único, listado, detalle, edición y desactivación; decidir reasignación si contienen insumos. |
| INS-02 | Pendiente | P1 | Asociar cada insumo a una categoría obligatoria. Migrar datos existentes sin pérdida, con categoría inicial explícita y editable. |
| INS-03 | Base | P1 | Validar alta, consulta, edición y retiro de insumos: nombre, SKU, unidad, cantidad, umbral y costo; conservar historial y vínculos de recetas. |
| INS-04 | Base | P0 | Verificar conversiones kg/g, l/ml y unidades, decimales y costos por unidad; nunca confundir ajuste de existencia con ingreso adicional. |
| INS-05 | Parcial | P1 | Foto de insumo con carga local, previsualización y validación; hoy el formulario conserva un campo de enlace HTTPS. |
| INS-06 | Parcial | P1 | Filtros por nombre, categoría y stock, detalle y paginación; no ocultar datos por límites de consulta. |
| INS-07 | Pendiente | P2 | Exportar listado filtrado de insumos a Excel/PDF con unidades, categoría, existencia y stock crítico. |
| INS-08 | Parcial | P0 | Auditar ajustes de stock, autor y motivo; definir equivalencia entre `active` actual y `deleted_at` solicitado. No editar migraciones ya ejecutadas. |

## 6. Categorías de productos, productos y recetas

| ID | Estado | Prioridad | Tarea y criterio de aceptación |
|---|---|---|---|
| PRO-01 | Parcial | P1 | Gestión completa de categorías de productos. Existe consulta; faltan alta, edición y desactivación con control de productos/menús asociados. |
| PRO-02 | Parcial | P1 | Integrar catálogo completo en Productos: platos preparados y bebidas/agua por unidad. El menú actual conduce principalmente a recetas. |
| PRO-03 | Parcial | P1 | Conectar CRUD de producto con interfaz accesible: nombre, descripción, precio, categoría, stock aplicable, imagen y fechas. Los endpoints existen, pero hay que verificar todos los recorridos visibles. |
| PRO-04 | Base | P1 | Validar carga local de foto, reemplazo, dimensiones y actualización inmediata en Productos y Ventas; probar errores 415, tipo falso y archivo grande. |
| PRO-05 | Base | P0 | Validar receta y rendimiento: ingredientes, cantidades/unidades y costo por porción. Una receta de cuatro porciones debe descontar un cuarto por porción vendida. |
| PRO-06 | Parcial | P0 | Hacer explícito preparado/no preparado, evitando depender únicamente del nombre o slug de categoría; impedir vender preparados sin receta válida. |
| PRO-07 | Pendiente | P2 | Exportar productos a Excel/PDF con filtros, precios y stock/disponibilidad; distinguir stock físico de porciones calculadas. |
| PRO-08 | Parcial | P1 | Gestionar menú buffet, composición y extras desde administración; comprobar cantidad de menús y precios de extras según las reglas acordadas, sin límites inventados. |
| PRO-09 | Base | P1 | Validar navegación independiente Insumos/Productos, formularios y modales móviles; ninguna acción debe quedar tapada por el menú inferior. |

## 7. Ventas, pagos e inventario transaccional

| ID | Estado | Prioridad | Tarea y criterio de aceptación |
|---|---|---|---|
| VEN-01 | Base | P0 | Probar venta individual y buffet, varias cantidades y extras; servidor recalcula precios, subtotales y total sin confiar en importes del navegador. |
| VEN-02 | Parcial | P1 | Completar campos del documento: nombre/identificador, estado, correo, teléfono, retiro, comentario y dirección según DEC-06. |
| VEN-03 | Base | P1 | Validar historial y detalle completo con composición, cantidades, pago y autor; agregar filtros/paginación si faltan y evitar pantallas blancas. |
| VEN-04 | Base | P0 | Validar edición completa con control de versión, compensación de stock y auditoría; error intermedio revierte toda la operación. |
| VEN-05 | Pendiente | P0 | Implementar anulación según DEC-04 con motivo, permisos y reflejo financiero; no borrar silenciosamente ventas ni movimientos. |
| VEN-06 | Base | P0 | Verificar descuento atómico por receta y producto, agregación de insumos compartidos y concurrencia entre dos cajas. Las anotaciones transaccionales por sí solas no certifican estas pruebas. |
| VEN-07 | Pendiente | P0 | Implementar confirmación de faltantes según DEC-02: mostrar cantidades requeridas/disponibles, Sí/No y autorización en backend. Actualmente el servicio lanza error por stock insuficiente. |
| VEN-08 | Pendiente | P0 | Evitar ventas y cobros duplicados por doble clic, reintento o reconexión mediante idempotencia comprobada en servidor. |
| VEN-09 | Pendiente | P2 | Exportar listado de ventas a Excel/PDF con filtros, detalles y tratamiento explícito de anuladas; los reportes financieros no sustituyen este listado. |
| VEN-10 | Base | P1 | Validar comprobante de cliente y comanda impresa de 80 mm, copias y pedidos editados; mantener separados precios del cliente e instrucciones de cocina. |

## 8. Mesas, órdenes y cierre

| ID | Estado | Prioridad | Tarea y criterio de aceptación |
|---|---|---|---|
| MES-01 | Pendiente | P1 | CRUD de mesas con nombre único y fechas; impedir eliminar una mesa con consumo activo. |
| MES-02 | Pendiente | P1 | Mapa/listado Disponible/Ocupada; abrir una orden con usuario responsable. Controlar aperturas simultáneas. |
| MES-03 | Pendiente | P1 | Agregar productos y menús a la orden activa, acumular cantidades, observaciones y totales; conservar historial de cambios. |
| MES-04 | Pendiente | P1 | Mostrar precuenta detallada sin cobrar ni crear otra venta; distinguirla del comprobante final. |
| MES-05 | Pendiente | P0 | Implementar reserva/consumo según DEC-03; modificaciones, cancelaciones y ventas directas mantienen consistencia sin doble descuento. |
| MES-06 | Pendiente | P1 | Cierre/cobro: efectivo, débito, crédito y transferencia; propina opcional separada y usuario/fecha de cierre. |
| MES-07 | Pendiente | P0 | Cierre atómico: pago registrado, venta generada, stock afectado y mesa liberada juntos. Un fallo no deja mesa libre con cobro incompleto; repetir la petición no duplica la venta. |
| MES-08 | Pendiente | P1 | Actualizar mapa, historial y dashboard al cerrar; probar dos trabajadores operando la misma mesa. |

## 9. Comandas digitales

La comanda imprimible existente no equivale a un módulo de cocina con estados.

| ID | Estado | Prioridad | Tarea y criterio de aceptación |
|---|---|---|---|
| COM-01 | Pendiente | P1 | Persistir comanda vinculada a orden/mesa, productos, cantidades, observaciones y fechas; admitir venta directa sin mesa. |
| COM-02 | Pendiente | P1 | Generar comanda Pendiente automáticamente al confirmar productos; impedir duplicados por reintentos. |
| COM-03 | Pendiente | P1 | Panel cocina/barra ordenado por espera, con identificación legible y alertas de nuevo pedido. |
| COM-04 | Pendiente | P1 | Transiciones Pendiente → En preparación → Lista → Entregada, con permisos por función y trazabilidad de responsable/hora. |
| COM-05 | Pendiente | P1 | Actualización entre cocina y atención en tiempo real; definir mecanismo y latencia verificable, incluyendo reconexión sin pérdida de eventos. |
| COM-06 | Pendiente | P0 | Cambios y cancelaciones según DEC-08: transmitir diferencias, conservar historial y no volver a preparar ítems ya enviados. |

## 10. Dashboard, finanzas y notificaciones

| ID | Estado | Prioridad | Tarea y criterio de aceptación |
|---|---|---|---|
| DASH-01 | Base | P1 | Validar ingresos, cantidad de ventas y productos más vendidos contra datos de prueba conocidos, con rango de fechas y zona horaria del local. |
| DASH-02 | Base | P1 | Revisar gráficos, tablas e indicadores de costos/márgenes existentes; indicar claramente qué mide cada uno y el tratamiento de gastos, anulaciones y propinas. |
| DASH-03 | Parcial | P1 | Agregar panel prioritario de insumos con existencia menor o igual al umbral crítico, enlazado a Insumos. |
| DASH-04 | Base | P2 | Validar reportes financieros Excel/PDF: mismos filtros/totales que pantalla, títulos claros y datos vacíos sin fallos. |
| DASH-05 | Parcial | P1 | Actualizar indicadores al operar ventas y mesas; definir frecuencia y mostrar fecha de actualización. |
| NOT-01 | Parcial | P1 | Alertar tras cambios de stock: creación, ajuste, venta, edición y anulación; distinguir cambio normal de stock crítico. Existe consulta de notificaciones, no un historial completo de eventos. |
| NOT-02 | Parcial | P1 | Notificaciones por permisos: administrador, caja, cocina y garzón; ampliar el filtrado actual sin revelar ventas de otro usuario indebidamente. |
| NOT-03 | Definir | P2 | Implementar aviso diario/recordatorio según DEC-09, evitar duplicados y definir persistencia de leídas entre dispositivos. |

## 11. Calidad, configuración y entrega

| ID | Estado | Prioridad | Tarea y criterio de aceptación |
|---|---|---|---|
| CAL-01 | Parcial | P1 | Completar y validar parámetros globales: nombre, paleta y logo en login, navegación y pantallas. Existe código y V7, pero no se da por desplegado ni aceptado. |
| CAL-02 | Parcial | P1 | Unificar componentes, colores, formularios, confirmaciones y carga; teclado, contraste y móvil 390 × 844 sin superposiciones. |
| CAL-03 | Parcial | P0 | Revisar MER completo y crear migraciones nuevas por bloque; seeders idempotentes, datos demo separados de producción y respaldo antes de migrar. |
| CAL-04 | Parcial | P0 | Matriz de pruebas backend/frontend: permisos, errores, concurrencia, unidades, ventas, anulaciones, mesas y comandas. Pruebas existentes no cubren todo el alcance nuevo. |
| CAL-05 | Parcial | P1 | Actualizar manual con cada entrega y capturas móviles verificadas; guía por rol y explicación de comandos de arranque. |
| CAL-06 | Parcial | P0 | Revisar dependencias y configuración antes de exponer el sistema: HTTPS, secretos, cuentas demo, logs sin datos sensibles y backups con prueba de restauración. |
| CAL-07 | Parcial | P2 | Reducir carga inicial y archivos grandes, paginar catálogos/listados y revisar peticiones redundantes. |
| CAL-08 | Pendiente | P1 | Aceptación con el cliente: ejecutar recorrido realista desde ingreso de insumos hasta cierre de mesa, comanda, cobro, reporte y recuperación ante error. |

## 12. Orden de ejecución recomendado

1. **Acordar reglas:** DEC-01 a DEC-08 y actualizar el MER propuesto. No implementar excepciones de stock o anulaciones sin decidir su efecto.
2. **Fundamentos de acceso y datos:** ROL-02 a ROL-06, USR-03 a USR-06, CAL-03 y CAL-04. Conservar operativos los accesos actuales durante la migración.
3. **Completar inventarios:** INS-01 a INS-08 y PRO-01 a PRO-09. Prioridad visible inmediata: categorías de insumos y catálogo completo de Productos.
4. **Cerrar ventas e integridad:** VEN-01 a VEN-08, con pruebas de recetas, concurrencia y faltantes antes de ampliar mesas.
5. **Mesas y cocina:** construir juntos MES-01 a MES-08 y COM-01 a COM-06; dependen del modelo de orden activa y confirmación.
6. **Indicadores y avisos:** DASH y NOT alimentados por los estados y eventos definitivos.
7. **Exportaciones y entrega:** INS-07, PRO-07, USR-07, VEN-09, DASH-04 y CAL-05 a CAL-08. Exportar nunca incluye contraseñas.

La validación y documentación se hacen en cada bloque, no solamente al final. No se fijan fechas de entrega hasta resolver decisiones y estimar el primer bloque con pruebas.

## 13. Evidencia de la clasificación inicial

- `backend/src/main/java/cl/buenplato/auth/AuthController.java`: login, sesión y salida; no es CRUD de trabajadores.
- `backend/src/main/java/cl/buenplato/config/SecurityConfig.java`: restricciones por roles estáticos; no matriz configurable.
- `backend/src/main/java/cl/buenplato/inventory/InventoryController.java`: CRUD de insumos y consulta/guardado de recetas.
- `backend/src/main/java/cl/buenplato/catalog/CatalogController.java`: CRUD de productos y solo lectura de categorías.
- `backend/src/main/java/cl/buenplato/sales/SalesController.java`: creación, consulta y edición; no endpoint de anulación.
- `backend/src/main/java/cl/buenplato/sales/SalesService.java`: descuentos transaccionales y bloqueo ante faltantes.
- `backend/src/main/java/cl/buenplato/finance/FinanceController.java`: dashboard, gastos y reportes financieros.
- `backend/src/main/java/cl/buenplato/shared/NotificationController.java`: avisos consultados según administrador/cajero.
- `frontend/src/features/sales/printOrder.ts`: comprobante y comanda para impresión, no panel de cocina.
- `frontend/src/App.tsx` y `frontend/src/features/inventory/RawInventoryView.tsx`: navegación separada con Productos orientado a recetas.
- `backend/src/main/resources/db/migration/`: V1–V7; no se encontraron módulos de mesas, comandas digitales ni matriz dinámica de permisos en las rutas examinadas.
- `backend/src/test/java/cl/buenplato/`: pruebas de aplicación, fotos y corrección de ventas existentes, pendientes de ejecutar en esta auditoría.

## 14. Plantilla para ejecutar una tarea

```text
ID y título:
Estado inicial:
Objetivo del usuario:
Alcance incluido / excluido:
Dependencias y decisiones:
Cambios de backend / interfaz / base de datos:
Permisos requeridos:
Casos de éxito, error y concurrencia:
Criterios de aceptación:
Pruebas ejecutadas y resultado:
Capturas y documentos actualizados:
Estado final y pendientes:
```

## 15. Fuera de esta entrega

Este cambio solo crea planificación y seguimiento. No crea usuarios, tablas ni funcionalidades nuevas. SMTP y boleta tributaria SII siguen aplazados por acuerdos anteriores; la impresión automática también requiere una integración específica y no debe confundirse con la impresión manual existente. No se publican tareas en GitHub ni se modifican repositorios remotos.
