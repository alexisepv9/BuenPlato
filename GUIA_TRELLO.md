# Preparar Trello sin conectar tu cuenta

Tablero sugerido: Sistema de gestión comercial.

## Carga manual, sin complementos

Trello no ofrece una importación nativa general de archivos. Este paquete es para copiar y pegar; no es un archivo que reconstruya automáticamente un tablero.
Fuente: https://support.atlassian.com/trello/docs/importing-data-into-trello/

1. Crea un tablero privado con el nombre sugerido.
2. Crea listas: Ideas, Por definir, Pendiente, En desarrollo, Por validar y Terminado.
3. Abre TARJETAS_TRELLO.txt y copia todo su contenido.
4. En la lista Por definir, pulsa Añadir una tarjeta y pega el texto. Si Trello pregunta, elige crear una tarjeta por cada línea. Verifica que aparecen 13 tarjetas, no una sola.
5. Para cada tarjeta, copia las subtareas de la sección correspondiente de este documento. Puedes pegarlas como descripción; para seguimiento individual, crea una checklist llamada Subtareas y agrega sus elementos. Verifica la separación si pegas varias líneas.
6. Todas comienzan sin marcar. Cuando una función ya exista, primero comprueba su funcionamiento antes de completar su subtarea.

## Reglas de avance

- Una tarjeta es un módulo general; sus subtareas son unidades de trabajo.
- Las funciones opcionales no son obligatorias para todos los negocios.
- No desarrollar todos los módulos a la vez: elegir una subtarea y acordar su resultado esperado.
- Si una subtarea crece, convertirla en tarjeta propia y enlazarla al módulo.
- En desarrollo: al menos una subtarea activa. Por validar: implementación lista para probar. Terminado: subtareas aceptadas y documentación actualizada.
- Mantener notas de lo existente, lo pendiente y los problemas descubiertos. No marcar como terminado por tener código.
- Para avanzar desde este chat sin integración, indícame tarjeta y subtarea; después de trabajar tú actualizas Trello. Este archivo no sincroniza estados.
- No se crea ningún tablero, no se suben datos ni se cambia el código con estos archivos.

## Tarjetas y subtareas

### 01 · Definición del sistema

Copia este bloque como subtareas de la tarjeta:

```text
Definir negocios objetivo y alcance inicial
Separar núcleo común de módulos opcionales
Definir una empresa o múltiples empresas por instalación
Acordar qué puede hacer el cliente
Priorizar primera versión y criterios de aceptación
```

### 02 · Configuración del negocio

Copia este bloque como subtareas de la tarjeta:

```text
Validar nombre, logo y paleta global existentes
Definir moneda, zona horaria y preferencias
Configurar módulos habilitados
Proteger cambios con permisos y auditoría
Probar persistencia y actualización en otras sesiones
```

### 03 · Usuarios y permisos

Copia este bloque como subtareas de la tarjeta:

```text
Validar login, sesión y cierre existentes
Crear, editar y desactivar trabajadores
Gestionar roles y matriz de permisos
Proteger al administrador y las rutas del backend
Definir recuperación de acceso
Exportar trabajadores sin contraseñas
```

### 04 · Catálogo de productos y servicios

Copia este bloque como subtareas de la tarjeta:

```text
Gestionar categorías de productos
Unificar catálogo de preparados y productos de venta directa
Crear, editar, consultar y retirar productos
Gestionar fotos locales y precios
Definir si se ofrecerán servicios sin inventario
Exportar catálogo a PDF y Excel
```

### 05 · Inventario e insumos

Copia este bloque como subtareas de la tarjeta:

```text
Gestionar categorías de insumos
Validar unidades y conversiones
Registrar entradas, ajustes y salidas con motivo
Gestionar fotos locales
Configurar stock crítico y consultar movimientos
Definir reglas de stock insuficiente
Exportar inventario a PDF y Excel
```

### 06 · Producción y composiciones — opcional

Copia este bloque como subtareas de la tarjeta:

```text
Generalizar receta como composición de componentes
Definir rendimiento, consumo y costo unitario
Validar descuento transaccional existente
Distinguir productos preparados de venta directa
Gestionar mermas y ajustes
Probar concurrencia y cambios de composición
```

### 07 · Pedidos y ventas

Copia este bloque como subtareas de la tarjeta:

```text
Validar venta directa y cantidades
Validar menús, conjuntos y extras como opción del negocio
Completar datos del cliente y modalidad de entrega
Consultar y editar pedido completo
Definir anulación y efecto en inventario
Confirmar faltantes con permiso y auditoría
Evitar duplicados por reintentos
Exportar ventas a PDF y Excel
```

### 08 · Cobros y comprobantes

Copia este bloque como subtareas de la tarjeta:

```text
Definir medios de pago y pagos pendientes
Separar propinas de ingresos
Definir devoluciones y pagos divididos
Validar comprobante de cliente e impresión existente
Definir integración de impresión automática como tarea separada
Mantener integración tributaria fuera del alcance hasta acordarla
```

### 09 · Mesas y atención — opcional

Copia este bloque como subtareas de la tarjeta:

```text
Crear, editar y retirar mesas
Mostrar disponibilidad y abrir consumo
Acumular productos en una orden activa
Definir reservas de stock antes del cobro
Generar precuenta
Cobrar y liberar mesa de forma atómica
Probar atención simultánea
```

### 10 · Comandas y preparación — opcional

Copia este bloque como subtareas de la tarjeta:

```text
Generar comanda sin duplicados al confirmar pedido
Crear panel de cocina y barra
Gestionar Pendiente, En preparación, Lista y Entregada
Actualizar atención y cocina con reconexión
Notificar cambios y cancelaciones sin repetir preparación
Validar permisos y tiempos de espera
```

### 11 · Reportes y administración

Copia este bloque como subtareas de la tarjeta:

```text
Validar indicadores y gastos existentes
Definir ingresos, costos y márgenes
Mostrar ranking de productos y tendencias
Filtrar por fechas y zona horaria
Incorporar anulaciones, propinas y mesas correctamente
Validar exportaciones financieras Excel y PDF
```

### 12 · Notificaciones

Copia este bloque como subtareas de la tarjeta:

```text
Definir avisos por stock y ventas
Definir avisos operativos por rol
Notificar cambios de stock y umbrales críticos
Evitar duplicados y definir recordatorios diarios
Definir lectura persistente entre dispositivos
```

### 13 · Calidad, seguridad y entrega

Copia este bloque como subtareas de la tarjeta:

```text
Revisar MER, migraciones y seeders por módulo
Probar permisos, transacciones y concurrencia
Revisar dependencias, sesiones y configuración de producción
Unificar interfaz y accesibilidad móvil
Probar respaldo y restauración
Actualizar manual y capturas en cada entrega
Validar recorrido completo con el cliente
```


