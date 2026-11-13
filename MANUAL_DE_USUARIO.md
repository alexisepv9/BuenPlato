# Manual de usuario — Buen Plato

Si una pestaña abierta antes de actualizar sigue mostrando error 415 al subir una
foto, recárgala antes de reintentar. El cliente HTTP ya no impone JSON a todos los
envíos y el documento inicial evita caché para cargar la versión actual del sistema.

Corrección de carga de fotos: se corrigió el error 415 del envío de archivos.
Si una foto no se actualizó, recarga la aplicación, vuelve a seleccionarla y pulsa
Guardar foto. Los intentos rechazados anteriormente no guardaron el archivo.

## Subir una foto propia al plato

Como administrador, abre Inventario > Recetas de platos > Ajustar preparación.
En Foto del plato selecciona un archivo de tu equipo, revisa la vista previa y
pulsa Guardar foto. Se guarda inmediatamente, por separado de Guardar preparación.
Para recetas nuevas, guarda primero la preparación y después abre Ajustar.

Se aceptan JPG/PNG hasta 5 MB y dimensiones entre 640 × 360 y 4096 × 4096 px.
Recomendado: 1280 × 720 (16:9). Otras proporciones muestran una advertencia de
recorte visual; no se recorta el archivo original al cargarlo. El servidor valida
también los archivos y los convierte a PNG. La nueva foto reemplaza la anterior.
Recetas y Ventas consultan el mismo archivo del storage; si no existe, muestran
una foto de ejemplo. No se cambian las imágenes de materias primas ni del menú general.
Esta función sustituye la limitación anterior de no poder asignar fotos a platos.

### Fotos en Recetas de platos

Las tarjetas de recetas muestran ahora la misma foto ilustrativa local que Ventas:
comida para platos y fruta para postres. Se consultan mediante `/api/images/demo/`
y permanecen identificadas como fotos de ejemplo. Aún no hay carga de una foto
propia por plato; estas imágenes genéricas no representan necesariamente la receta.

## Impresión de 80 mm: cliente y cocina

Después de guardar una venta, usa **Imprimir comprobante cliente** o **Imprimir
comanda**. Se abre una vista previa en otra ventana; pulsa **Imprimir** y selecciona
la impresora correspondiente en Windows. Permite ventanas emergentes para el sitio.
Configura papel de 80 mm, escala 100 %, sin encabezados ni pies del navegador;
la longitud y el corte dependen del controlador de la impresora.

El cliente recibe detalle, total y pago con la leyenda **NO VÁLIDO COMO BOLETA
TRIBUTARIA**. No hay integración SII, folios fiscales ni timbres inventados.
La comanda lleva número, fecha/hora de venta (Chile), servicio, cliente si existe,
platos agrupados por menú, cantidades totales y observaciones, sin precios.
Desde Historial > Ver venta completa puedes reimprimir ambos documentos, marcados
como copia. Los pedidos modificados indican versión y reemplazo de la comanda
anterior; cocina debe verificar antes de preparar nuevamente.
Imprimir no crea otra venta ni descuenta stock. El navegador no confirma la salida
física del papel y no selecciona automáticamente las dos impresoras USB.
La impresión física y el corte deben probarse en el equipo del local.

## Corregir un pedido completo

En Venta > Historial, pulsa **Modificar pedido completo**. El pedido se carga
en el punto de venta: puedes quitar o agregar productos, editar el buffet y sus
cantidades, cliente, servicio, pago y notas. **Guardar cambios** modifica la misma
venta; **Cancelar pedido y volver** descarta el borrador sin tocar los datos.
Los precios y recetas se recalculan con el catálogo vigente; revisa el total
anterior y el nuevo antes de guardar. Si cobraste o devolviste una diferencia,
debes gestionarla por tu medio de pago: el sistema no ejecuta reembolsos bancarios.
Las opciones desactivadas requieren revisión del administrador antes de editar.
El sistema devuelve el consumo original y descuenta el corregido de manera
atómica. Si falta stock, no guarda la corrección. Se conserva una copia anterior
para auditoría y se rechazan cambios basados en una versión desactualizada.
Administrador y cajero pueden corregir ventas. El estado de preparación se cambia
desde **Editar atención y pago**. El detalle muestra cantidades totales por plato,
sin repetir textos como «Elige tu proteína».

## Campana de notificaciones

- Administrador: faltantes de materias primas y bebidas, y últimas 20 ventas.
- Cajero: últimas 20 ventas registradas con su propia cuenta, sin datos de bodega.
- Otros roles: no reciben estas notificaciones.

Pulsa la campana para abrir el panel. El número indica alertas sin leer.
**Marcar como leídas** guarda la lectura por usuario en este navegador, no entre
dispositivos. Actualiza cada 15 segundos mientras la página está visible y al
guardar ventas desde esta pantalla. Las alertas de stock desaparecen al reponer;
la lista muestra hasta 50 materias primas y 50 bebidas con bajo stock.
No son correos ni notificaciones del sistema operativo. Capturas móviles pendientes.

### Corrección del historial

Se corrigió la pantalla blanca al consultar ventas con buffet. El detalle conserva
las selecciones originales y no modifica ventas ni existencias. En Venta, abre
Historial de ventas y luego Ver venta completa. Si tenías la versión anterior
abierta, recarga con Ctrl + F5 y vuelve a iniciar sesión si se solicita.

## Guía de arranque

Consulta [Comandos de arranque](COMANDOS_DE_ARRANQUE.md), en la raíz del proyecto:
Docker, desarrollo local, pruebas, migraciones y diagnóstico sin borrar datos.

### Presentación del buffet

El buffet y sus opciones muestran la foto en la parte superior, sin un icono
decorativo adicional junto a ella. Se conservan los controles + y − para ajustar
las cantidades y el resaltado de selección. No cambian precios ni existencias.

### Tarjetas de productos individuales

Cada producto muestra una foto ilustrativa arriba, nombre completo y precio.
Se eliminó el icono decorativo lateral. Los botones − y + están debajo de la
foto y permiten ajustar la cantidad; los productos sin stock indican Agotado.
La tarjeta seleccionada mantiene los colores del buffet. No cambian precios,
permisos ni reglas de stock. Revisión visual móvil pendiente.

### Resumen y detalle de ventas

El resumen mantiene el diseño lateral derecho en escritorio, incluso al configurar
un buffet. Se actualiza con las selecciones y cantidades; un menú en edición
sustituye su importe anterior en la vista previa, sin duplicarlo. En móvil se usa
el mismo panel desplegable, no un resumen adicional encima del formulario.
El importe en configuración es provisional: agrega el menú para habilitar el cobro.

Al agregar el buffet configurado o seleccionar un producto individual, el resumen
se abre automáticamente. Si estás eligiendo productos, termina o cierra ese panel
para verlo. Durante la configuración del buffet se muestra su importe provisional;
solo se incorpora al total cobrable al pulsar Agregar menú.
En **Venta > Historial de ventas > Ver venta completa** puedes consultar productos,
cantidades, composición del buffet, precios base, recargos guardados, importes,
cliente, fecha, servicio, pago, estado y notas. Disponible solo para administrador
y cajero, con permisos comprobados por el servidor. No cambia el alcance de
Editar atención y pago conserva los productos; Modificar pedido completo permite reemplazarlos y recalcula el stock.

### Fotos ilustrativas en ventas y cierre de sesión

El buffet, sus opciones y los productos individuales muestran fotos de ejemplo,
no fotografías reales de cada plato. Se utilizan dos muestras de Lorem Picsum
(https://picsum.photos): comida y fruta. La primera carga necesita Internet en
el servidor; después se leen desde su almacenamiento local. Si falla la foto,
aparece un icono y puedes continuar vendiendo. No cambia el stock ni el precio.
El botón de cerrar sesión está en la cabecera compartida de Venta, Inventario
y Finanzas, tanto en escritorio como en móvil. Cierra primero cualquier modal
para acceder a la cabecera.

Las fotos se conservan en el volumen `image-storage` de Docker. No elimines
volúmenes al actualizar. Las fotos por enlace existentes en materias primas
no se modifican en esta entrega. Capturas móviles pendientes de validación.

Actualización de mantenimiento: se reorganizó internamente la aplicación por
módulos para facilitar soporte y correcciones. Los botones, permisos y recorridos
de usuario se mantienen; no es necesario aprender un procedimiento nuevo.

### Fotos del inventario

En **Materias primas > Editar**, pega una dirección directa HTTPS en **Enlace
de la imagen** y pulsa **Actualizar materia prima**. También puedes hacerlo al
crear una materia prima. Vacía el campo para quitar la foto. Las tarjetas
muestran “Sin imagen” si falta la foto o no puede cargarse. Esta versión acepta
enlaces; no carga archivos desde el teléfono.

**Versión:** demostración 1.0  
**Audiencia:** administrador del local y personal de caja  
**Objetivo:** operar ventas buffet, productos individuales, inventario y análisis financiero.

> Este manual forma parte del producto. Debe revisarse con cada cambio funcional o visual y sus capturas deben renovarse cuando la pantalla correspondiente cambie.

## 1. Antes de comenzar

Buen Plato se utiliza desde un navegador en teléfono, tablet o computador. En la instalación Docker local, la dirección es:

```text
http://localhost
```

Solicite sus credenciales al responsable del sistema. No comparta su contraseña ni utilice las cuentas de demostración con información real.

## 2. Iniciar y cerrar sesión

1. Abra la dirección entregada por el responsable técnico.
2. Escriba correo y contraseña.
3. Pulse **Entrar a Buen Plato**.
4. Compruebe su nombre y perfil en el menú.

Para salir, pulse **Cerrar sesión**. Cerrar solo la pestaña no equivale a cerrar la sesión.

Si aparece “usuario o contraseña incorrectos”, revise mayúsculas, espacios y el correo completo. Si el sistema informa que no puede conectar con la API, avise al soporte y entregue la hora del error.

## 3. Navegación

El sistema contiene tres áreas:

- **Venta:** arma pedidos buffet, agrega productos individuales y consulta el historial.
- **Inventario:** consulta existencias, crea, edita y desactiva productos.
- **Finanzas:** analiza ventas, costos, gastos, márgenes y exporta reportes.

En móvil, la navegación aparece en la parte inferior. En escritorio, aparece en el lateral.

## 4. Registrar una venta

### 4.1 Agregar un menú buffet

1. Entre en **Venta**.
2. Seleccione **Almuerzo Buffet** y pulse **Configurar menú**.
3. Indique cuántas unidades del mismo menú venderá.
4. Seleccione proteína, agregados, ensalada y postre según las opciones visibles.
5. Revise los valores adicionales. La cantidad del pedido multiplica el precio del menú; no agrega automáticamente nuevas selecciones.
6. Confirme la configuración para incorporarla al pedido.

Una opción con precio extra incrementa el valor del menú. Si no hay stock suficiente, el backend rechazará la venta y no guardará una operación incompleta.

### 4.2 Agregar productos individuales

1. Pulse la opción de productos individuales.
2. Use los filtros superiores para encontrar bebidas, proteínas, agregados, ensaladas, postres u otros productos.
3. Aumente o disminuya la cantidad deseada.
4. Cierre el selector para volver al resumen.

### 4.3 Confirmar el pedido

1. Revise cada línea y el total.
2. Opcionalmente escriba el nombre del cliente.
3. Seleccione **Para llevar** o **Consumir aquí**.
4. Seleccione efectivo, tarjeta o transferencia.
5. Agregue notas de cocina cuando corresponda.
6. Pulse **Confirmar** una sola vez y espere la respuesta.

Al confirmar, el sistema crea la venta, guarda sus líneas, descuenta inventario y registra movimientos de stock en una sola transacción.

## 5. Historial y modificación de ventas

1. En **Venta**, abra **Historial de ventas**.
2. Localice la venta por número, fecha o información visible.
3. Abra **Editar venta**.
4. Modifique cliente, servicio, estado, medio de pago o notas.
5. Pulse **Guardar cambios**.

Para corregir productos o cantidades usa Modificar pedido completo. Se recalcula el stock de forma atómica y queda una versión anterior para auditoría; no necesitas ajustes manuales de inventario.

## 6. Inventario de materias primas

### 6.1 Consultar

La pantalla muestra ingredientes de bodega, no platos preparados: arroz, aceite,
carne, sal, verduras y otros insumos. Puede:

- Buscar por nombre.
- Mostrar stock bajo.
- Mostrar productos agotados.
- Cambiar de página si existen muchos resultados.

Estados:

- **Normal:** stock superior al umbral de aviso.
- **Stock bajo:** stock positivo e igual o inferior al umbral.
- **Agotado:** stock igual a cero.
- **Unidad base:** gramos (`g`), mililitros (`ml`) o unidades.

### 6.2 Crear una materia prima

1. Pulse **Nueva materia prima**.
2. Seleccione una categoría para el insumo.
3. Escriba el nombre.
4. Seleccione kg, g, l, ml o unidades.
5. Indique existencia, umbral de alerta y costo por la unidad seleccionada.
6. Guarde y confirme que aparezca en la lista.

El sistema convierte kg a g y litros a ml para realizar descuentos exactos. El
identificador interno (ID) se asigna automáticamente; no se solicita SKU.

### 6.3 Recetas y descuento automático

La pestaña **Recetas de platos** muestra el rendimiento, el costo por porción y
las materias primas de cada preparación. Ejemplo para Carne mechada:

```text
Rendimiento: 4 porciones
Carne: 1 kg
Sal: 6 g
Zanahoria: 100 g
Cebolla: 100 g
Ajo: 2 unidades
```

Al vender una porción se descuentan 250 g de carne, 1,5 g de sal, 25 g de
zanahoria, 25 g de cebolla y 0,5 unidad de ajo. Al vender cuatro porciones se
descuenta el lote completo. Si falta cualquier ingrediente, la venta se rechaza
y ningún stock queda parcialmente modificado.

Use **Editar** para corregir nombre, categoría, existencia actual, alerta o costo y
confirme con **Actualizar materia prima**. Los productos de peso se muestran en
kilogramos y los de volumen en litros para evitar tener que editar cifras como
10.000 g o 5.000 ml. La cantidad ingresada reemplaza la existencia actual; no
se suma a ella. Una materia prima usada por una receta no puede eliminarse.

Para crear una preparación nueva, pulse **Nueva preparación**, escriba su
nombre (por ejemplo, “Puré de papas casero”), indique su categoría y precio de
venta, defina cuántas porciones rinde la receta y agregue sus materias primas.
El sistema crea el plato en el catálogo y asocia la receta automáticamente; no
es necesario buscarlo previamente en una lista. Si el plato ya aparece como
**Receta pendiente**, pulse su tarjeta y complete solamente rendimiento e
ingredientes.

## 7. Finanzas

1. Entre en **Finanzas**.
2. Seleccione las fechas **Desde** y **Hasta**.
3. Espere que los indicadores se actualicen.

El período máximo consultable es de 366 días. Los cálculos incluyen ventas no canceladas.

Indicadores principales:

- **Ventas netas:** suma de ventas del período.
- **Ticket promedio:** ventas divididas por número de pedidos.
- **Costo de alimentos:** costo registrado de los artículos vendidos.
- **Utilidad bruta:** ventas menos costo de alimentos.
- **Gastos operacionales:** gastos fijos y variables registrados.
- **Resultado operacional:** utilidad bruta menos gastos operacionales.
- **Punto de equilibrio:** venta aproximada necesaria para cubrir gastos fijos con el margen observado.
- **Inventario valorizado:** existencia por costo unitario de materias primas activas.
- **Mermas:** costo de movimientos de materia prima clasificados como pérdida o merma.

Los análisis son apoyo para la gestión; dependen de que costos, stock y gastos estén correctamente registrados.

### 7.1 Registrar un gasto

1. Pulse **Registrar** en Gastos.
2. Complete fecha, categoría y descripción.
3. Ingrese un monto positivo.
4. Clasifique como **Fijo** o **Variable**.
5. Guarde el gasto.

### 7.2 Exportar reportes

Seleccione el período y pulse:

- **PDF:** documento para lectura o envío.
- **Excel:** libro para análisis y conciliación.

El navegador descargará un archivo cuyo nombre contiene las fechas consultadas.

## 8. Operación diaria recomendada

### Apertura

1. Confirmar que el sistema abre.
2. Iniciar sesión.
3. Revisar productos agotados y con stock bajo.
4. Corregir existencias antes de comenzar ventas.

### Durante el servicio

1. Confirmar cada pedido antes de cobrar.
2. Registrar el medio de pago correcto.
3. No pulsar repetidamente Confirmar mientras el sistema carga.
4. Informar errores indicando hora y operación realizada.

### Cierre

1. Revisar historial de ventas.
2. Comparar medios de pago con la caja real.
3. Registrar gastos del día.
4. Descargar el reporte si corresponde.
5. Cerrar sesión.

## 9. Solución de problemas

| Situación | Qué hacer |
|---|---|
| La página no abre | Verifique red y dirección; contacte al responsable técnico. |
| Sesión vencida | El sistema vuelve automáticamente al acceso y muestra un aviso. Ingrese nuevamente; los pedidos que no habían sido confirmados deberán armarse otra vez. |

En el acceso, pulse el icono de **ojo** del campo Contraseña para mostrar lo
escrito. Al pulsarlo nuevamente, la contraseña vuelve a ocultarse. Esta acción
no guarda ni modifica la clave.
| Producto no se guarda | Revise campos obligatorios, categoría y valores negativos. |
| Venta rechazada | Revise selecciones obligatorias y stock disponible. |
| Datos financieros incompletos | Verifique costos, gastos y ventas registrados en el período. |
| Error de API | Anote mensaje, hora y acción; entregue esos datos a soporte. |

## 10. Alcance y límites conocidos

- La cuenta `admin@buenplato.cl` tiene rol **Administrador general** y acceso total: ventas, historial, productos, materias primas, preparaciones, finanzas y reportes.
- La cuenta `caja@buenplato.cl` tiene rol **Caja** y acceso al punto de venta, catálogo operativo e historial. No puede modificar inventario, recetas, productos ni finanzas.
- Las contraseñas iniciales se consultan exclusivamente en `CUENTAS_LOCALES.md`, archivo confidencial que no se sube al repositorio.
- En **Inventario > Recetas de platos**, el administrador puede crear o ajustar el rendimiento y las cantidades de cada materia prima.
- Todo alimento preparado debe poseer receta. Los productos comprados listos para vender, como Agua Cachantun 1 L o Bebida Express 500 ml, pertenecen a **Bebestibles**, no poseen receta y descuentan unidades directamente.
- Preparaciones incluye recetas iniciales para proteínas, arroces, papas, vegetales, ensaladas, postres, empanadas y tallarines con salsa roja o verde.
- La pestaña indica los platos pendientes de receta. Un plato pendiente no puede venderse hasta que el administrador configure su rendimiento e ingredientes.
- El administrador puede retirar una materia prima mediante el botón de papelera de su tarjeta. La eliminación es lógica: desaparece del inventario activo, pero conserva el historial.
- Una materia prima utilizada por una preparación no puede retirarse. Primero debe abrirse la receta, quitar o reemplazar el ingrediente y guardar; después podrá retirarse desde Materias primas.
- Los resultados de acciones y errores aparecen como notificaciones flotantes en la parte superior. Se cierran automáticamente después de cinco segundos o mediante la `X`. Las indicaciones dentro de formularios permanecen junto al campo que debe corregirse.
- En teléfonos y tabletas, el contenido se desplaza dentro del espacio disponible
  entre la cabecera y la navegación inferior. La barra nunca cubre formularios,
  tarjetas ni botones, y respeta el área segura inferior del dispositivo.
- Al agregar productos, el botón **Ver pedido** y el resumen para finalizar la
  venta se abren siempre por encima de la navegación inferior. La navegación
  permanece visible y no queda cubierta durante el cobro.
- El administrador puede modificar el nombre visible del plato dentro de **Inventario > Recetas de platos > Ajustar preparación**.
- Guardar una preparación actualiza únicamente su tarjeta y el aviso de resultado; no recarga toda la pantalla de inventario.
- En el punto de venta, **Volver** abandona la configuración actual y **Cancelar pedido y volver** limpia el pedido aún no confirmado. Ninguna de estas acciones elimina ventas ya registradas.

- Modificar pedido completo sustituye productos y recalcula stock; Editar atención y pago solo cambia esos datos.
- No existe recuperación de contraseña desde la interfaz.
- La instalación local usa HTTP; no debe exponerse a Internet sin HTTPS y endurecimiento de seguridad.
- Para una demostración temporal mediante Cloudflare Quick Tunnel, Docker acepta
  exclusivamente direcciones HTTPS terminadas en `.trycloudflare.com`. La
  ventana de `cloudflared` debe permanecer abierta durante la demostración.
- Las cuentas y datos seed son de demostración.

## 11. Evaluación del manual

### Actualización: acciones del inventario

Cada insumo tiene una **Categoría** obligatoria. Selecciónala al crear o editar; si falta, escribe su nombre en «Nombre de nueva categoría», pulsa «Crear categoría» y selecciónala. En el listado, «Todas las categorías» permite filtrar junto al buscador y al estado de stock. Los registros anteriores quedan en «Sin clasificar» hasta que los asignes. Las categorías de insumos son independientes de las de productos; una categoría «Bebidas» no activa por sí sola su venta. Para instalar este cambio, reinicia el backend: Flyway ejecuta V8 automáticamente.

Para actualizar litros o cantidades existentes, abre «Editar datos y stock». «Unidad de medida» permite elegir Litros (L) o Mililitros (mL) para líquidos, y Kilogramos (kg) o Gramos (g) para peso. Al cambiar entre unidades equivalentes se convierten existencia, umbral y costo; después puedes escribir la cantidad real y guardar. No se convierte volumen en peso. Las tarjetas muestran L mayúscula para distinguirla del número 1; sin foto, usan gota para volumen, pesa para peso y bloques para unidades.

El SKU fue eliminado del modelo actual. Los productos e insumos se identifican mediante su ID interno. Después de actualizar el backend local, detén su proceso con Ctrl+C y vuelve a ejecutar `mvn spring-boot:run` desde `backend`; recargar solamente el navegador no actualiza las validaciones Java.

En **Insumos → Nueva materia prima / Editar datos y stock**, selecciona una foto del dispositivo o arrástrala al recuadro. Ya no se solicita enlace ni SKU: el ID interno se genera automáticamente. JPG/PNG, hasta 5 MB, mínimo 640 × 360 y máximo 4096 × 4096 píxeles. Al guardar, la imagen se almacena en el servidor y aparece en la tarjeta. Sin nueva selección se conserva la foto actual. Si los datos se guardan pero falla la imagen, se informa del resultado parcial; selecciona otra foto y reintenta sobre el mismo insumo, sin duplicarlo.

La navegación comparte orden en escritorio y celular: **Venta, Productos, Insumos, Finanzas, Configuración**. Las opciones dependen de permisos, no de la sección activa. El lateral de escritorio permanece visible al desplazarse. Las tarjetas muestran nombres sin SKU y cantidades con menor peso tipográfico.

La navegación ahora separa **Insumos** y **Productos**, tanto en escritorio como en celular. Ya no se agrupan en las pestañas de Inventario. En Insumos se administran materias primas, existencias y alertas. En Productos se encuentran las preparaciones, sus recetas y fotografías. Ambas opciones mantienen el acceso exclusivo del administrador. El buscador de Insumos no filtra los productos ni los ingredientes disponibles al editar una receta. Las instrucciones anteriores que mencionan «Inventario → Materias primas» corresponden ahora a «Insumos»; «Inventario → Recetas de platos» corresponde a «Productos».

Para cargar una foto, abre «Cambiar foto» y pulsa «Seleccionar imagen», o arrastra un JPG/PNG al recuadro. Se muestra una vista previa y el nombre del archivo. «Elegir otra» reemplaza la selección; «Quitar selección» la descarta sin borrar la foto guardada. Confirma con «Guardar foto». Solo se admite una imagen de hasta 5 MB, entre 640 × 360 y 4096 × 4096 píxeles; se recomienda 1280 × 720. La selección no se envía hasta pulsar guardar. El navegador abrirá su selector de archivos habitual, aunque el campo de la página ahora tiene un diseño personalizado.

- **Materias primas:** «Nueva materia prima» crea un ingrediente; «Editar datos y stock» modifica los datos y reemplaza la existencia por la cantidad ingresada. «Guardar cambios» confirma y «Cancelar» descarta los cambios no guardados.
- **Retirar:** solicita confirmación y conserva el historial. Si el ingrediente pertenece a una receta, primero debe quitarse de ella.
- **Recetas de platos:** «Nueva preparación» crea un plato y su receta. «Completar receta» configura los platos pendientes. «Editar receta» modifica ingredientes y rendimiento; «Guardar receta» confirma.
- **Cambiar foto:** abre una ventana independiente para seleccionar y guardar la fotografía local. No es necesario volver a guardar la receta. Al guardarla, la ventana se cierra y la tarjeta actualiza su imagen.
- El título y el botón principal cambian según la pestaña elegida, para no confundir la creación de ingredientes con la de platos.

El manual fue contrastado con la interfaz y las rutas implementadas. Un usuario nuevo puede completar los recorridos esenciales en este orden:

1. Entrar y reconocer la navegación.
2. Consultar stock y crear un producto.
3. Armar un menú, agregar un producto individual y confirmar una venta.
4. Encontrar y modificar los datos generales de esa venta.
5. Registrar un gasto y exportar finanzas.
6. Cerrar sesión y reconocer cuándo solicitar soporte.

La terminología coincide con las pantallas actuales y los límites relevantes están señalados antes de que el usuario dependa de una función inexistente. Recomendación para la próxima versión: añadir capturas numeradas cuando la interfaz visual se estabilice y separar un manual breve para caja.

## Categorías de insumos y retiro de SKU — 13/11/2026

### Productos genéricos: formulario único de alta y edición

**Eliminar producto:** pulse Eliminar en su tarjeta y confirme el nombre con **Sí, eliminar**. Cancelar o Escape cierran sin cambios mientras no se esté enviando la solicitud. Es una baja lógica: conserva ventas e insumos, pero retira el producto del catálogo y de nuevas ventas. Si falla la API, la ventana muestra el error y permite reintentar. Requiere permisos de administrador.

**Listado compacto:** las fotos mantienen su proporción cuadrada, con tarjetas más pequeñas. En celular se muestran dos columnas; en pantallas mayores la cantidad de columnas se adapta al espacio disponible. El botón **Editar** permanece al pie de cada tarjeta y conserva un área táctil de al menos 44 px de alto.

**Selector de ingredientes simplificado:** cada fila muestra el insumo con su unidad fija (g, mL o unidades), la cantidad y la papelera. Ya no hay un selector separado de unidad. La papelera quita el ingrediente de este producto, no elimina el insumo de la bodega; confirme con **Guardar producto**. Sin ingredientes, la venta descuenta solo las existencias del producto cuando su control de stock está activo; no descuenta insumos. Los productos previamente configurados sin control conservan esa excepción. Esta indicación sustituye la selección g/kg y mL/L descrita en versiones anteriores.

**Interfaz vigente — ingredientes opcionales sin selector de modo:** el formulario ya no muestra «Modo de venta y control de stock». Pulse **Agregar ingrediente** para abrir una fila con insumo, cantidad y unidad. Los insumos de peso admiten g/kg, los de volumen mL/L y los de conteo unidades. Cambiar g a kg o mL a L convierte la cantidad para conservar el mismo consumo; cambiar de insumo reinicia la cantidad a 1 en su unidad base. Puede quitar filas. Si no agrega ingredientes, un producto nuevo descuenta su propio stock; los productos antiguos sin control conservan esa configuración. Con ingredientes, se descuentan los insumos proporcionalmente a las unidades obtenidas indicadas (1 por defecto). Por ejemplo, 1 kg para 4 unidades descuenta 250 g por unidad vendida. Stock, precio y aviso del producto permanecen visibles. Esta interfaz sustituye las instrucciones anteriores sobre elegir un modo con un selector.

**Unidad de venta:** seleccione una opción agrupada por conteo, alimentos/porciones, envases/presentaciones, peso, volumen, longitud/superficie o servicios/tiempo. Ejemplos: unidades, porciones, botellas, cajas, kilogramos, litros, metros o servicios. Una unidad antigua que no esté en el catálogo aparece en **Unidad actual**, sin alterarse al abrir el formulario. El precio, stock y umbral deben expresarse en la unidad elegida: una caja cuenta como una caja, no como sus artículos internos. Cambiar la unidad no convierte cantidades ni precios. Las unidades de insumos de una composición se mantienen independientes. Seleccionar una unidad de peso o tiempo no añade por sí solo venta fraccionada ni funciones de agenda.

**Ajuste de presentación:** crear y editar usan una sola columna, también en escritorio. La fotografía tiene un espacio cuadrado de tamaño fijo para que no deforme los campos. Nombre, categoría, precio, unidad, descripción, stock actual y **Avisar cuando queden** permanecen visibles. El selector **Modo de venta y control de stock** permite elegir producto sin ingredientes, producto con ingredientes o sin control. Solo la opción con ingredientes muestra los componentes y el rendimiento. En ese modo, los descuentos y alertas corresponden a los insumos; los valores de stock/aviso del producto se conservan para venta directa. En modo sin control, esos valores se guardan pero no generan descuentos. Cambiar el selector no borra las cantidades escritas en stock y alerta.

En **Productos**, todos los artículos se muestran juntos con foto cuadrada, nombre, categoría, precio y política de inventario. Puede buscar por nombre o filtrar por categoría. Ya no se separan platos pendientes ni se exige que un producto sea comida.

**Nuevo producto** y **Editar producto** abren el mismo formulario. Complete nombre, categoría, descripción opcional, precio, unidad de venta y fotografía del dispositivo. En **Control de inventario** elija:

- **Por existencias del producto:** indique stock actual y alerta; cada venta descuenta la cantidad vendida. Ejemplo: botella o paquete de galletas.
- **Por composición de insumos:** indique las unidades obtenidas y los insumos con sus cantidades, en g, mL o unidades según cada insumo. Se exige al menos un componente y no se permite repetirlo. Ejemplo: una cazuela, un jugo preparado o un kit.
- **Sin control de existencias:** las ventas no descuentan stock ni insumos.

La categoría solo organiza: no determina el control de inventario. Al cambiar a existencias o sin control se desactiva la composición anterior, sin borrar ventas históricas. El cambio no transforma insumos en existencias ni repone cantidades automáticamente. Datos comerciales y composición se guardan juntos; la fotografía se sube después. Si falla la foto, el mensaje indica que el producto ya está guardado y permite reintentar sin duplicarlo. Cancelar después de ese aviso no deshace el guardado.

Esta actualización requiere reiniciar el backend y recargar el frontend. No necesita migración ni resembrado: conserva productos, IDs, cantidades y categorías existentes. Los términos técnicos `recipes` y `recipe_ingredients` se mantienen en la base para representar la composición opcional.

### Error al guardar una preparación

### Fotos locales en productos y preparaciones

La vista previa muestra primero el archivo seleccionado, después la foto propia guardada. En productos existentes sin foto propia puede mostrar la misma imagen de ejemplo local del catálogo, identificada como **Foto de ejemplo local**. Si tampoco puede cargarla, indica **Sin foto disponible**; si falla un archivo recién seleccionado, informa el error sin sustituirlo por una foto de ejemplo. Seleccionar un archivo no lo guarda hasta confirmar el formulario.

**Ingredientes opcionales:** ya no existe el aviso «platos pendientes de receta». Un producto sin receta activa es de venta directa y descuenta su propio stock cuando tiene control de existencias activado. Agregar ingredientes permite descontar insumos según el rendimiento de la receta. Para volver a venta directa, quite todos los ingredientes y guarde: se desactiva la receta, sin borrar el historial. Revise las existencias del producto antes de venderlo; quitar ingredientes no repone stock automáticamente. Los productos sin receta continúan visibles en Productos.

Los formularios de alta y edición de productos, y el formulario de preparación, permiten **Seleccionar foto del dispositivo** o arrastrar un JPG/PNG. Se utiliza el mismo selector de Insumos, con vista previa cuadrada sin recortar el archivo. Se recomienda 800 × 800 px; máximo 5 MB y límites aceptados de 640 × 360 a 4096 × 4096 px. No se solicita un enlace externo. Al confirmar, se guardan los datos y luego la imagen en el almacenamiento del servidor. Si solo falla la imagen, el formulario informa que los datos ya fueron guardados y permite reintentar sin crear otro producto. Cerrar o cancelar no revierte datos que ya se hubieran guardado.

Se corrigió un fallo al asociar por primera vez una receta a un producto: podía responder 500 aunque los datos fueran válidos. La corrección requiere reiniciar el backend para cargar el código actualizado. Si ocurre un 500 al editar nombre, precio o foto, conserve el mensaje de la terminal del backend y señale el campo modificado: ese código por sí solo no identifica la causa. No cree otro producto para intentar resolverlo.

### Listado de categorías con DataTables

**Desactivar categoría:** la confirmación se abre en una ventana independiente con el mismo diseño de edición, ya no debajo de la tabla. Revise el nombre, seleccione una categoría de destino si tiene insumos y pulse **Confirmar desactivación**. **Cancelar**, la cruz o Escape cierran sin cambios mientras no se esté guardando. Durante el envío aparece **Desactivando…** y se bloquean los botones. Si ocurre un error, la ventana conserva la selección para corregirla y reintentar. El foco inicial está en Cancelar para evitar confirmaciones accidentales.

Abra **Insumos → Categorías**. La tabla permite buscar por nombre, ordenar pulsando el encabezado **Categoría** y mostrar 5, 10 o 25 registros por página. **Editar** abre una ventana independiente con el nombre actual seleccionado. Modifique el nombre y pulse **Guardar cambios**; mientras se guarda aparece un indicador y se bloquean los botones para evitar envíos repetidos. **Cancelar**, la cruz o Escape cierran sin guardar cuando no hay una petición en curso. Si falla la API, la ventana conserva el texto y muestra el error. El formulario superior se utiliza únicamente para crear categorías. **Desactivar** abre la confirmación con destino para reasignar insumos. La categoría predeterminada no se desactiva. En pantallas estrechas, deslice la tabla horizontalmente si fuera necesario. La búsqueda y paginación solo cambian la visualización, no los datos almacenados.

En **Insumos → Categorías**, el administrador puede crear, renombrar y desactivar categorías sin agregar opciones al menú lateral. Para desactivar una categoría utilizada, seleccione otra como destino: los insumos se reasignan juntos, sin cambiar sus existencias. La categoría inicial no puede desactivarse. En el formulario de insumo se selecciona la categoría y en el listado se puede filtrar por ella.

La migración V9 elimina las columnas SKU; conserva IDs, recetas, ventas y stock. Las migraciones históricas no se modifican y pueden mencionar SKU. Antes de actualizar una instalación existente, respalde la base. Los seeders modificados no reinsertan productos o ingredientes si ese seeder ya se ejecutó anteriormente; las instalaciones nuevas reciben los datos demo. Verificado con pruebas H2; la actualización de una base PostgreSQL existente requiere validación adicional.

