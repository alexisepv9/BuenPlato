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

- Buscar por nombre o SKU.
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
2. Ingrese un SKU único, por ejemplo `MP-ARROZ`.
3. Escriba el nombre.
4. Seleccione kg, g, l, ml o unidades.
5. Indique existencia, umbral de alerta y costo por la unidad seleccionada.
6. Guarde y confirme que aparezca en la lista.

El sistema convierte kg a g y litros a ml para realizar descuentos exactos. El
SKU no puede repetirse.

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

Use **Editar** para corregir nombre, SKU, existencia actual, alerta o costo y
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
| Producto no se guarda | Revise campos obligatorios, SKU duplicado y valores negativos. |
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
