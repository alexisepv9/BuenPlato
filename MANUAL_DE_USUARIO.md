# Manual de usuario — Buen Plato

**Versión:** demostración 1.0  
**Audiencia:** administrador del local y personal de caja  
**Objetivo:** operar ventas buffet, productos individuales, inventario y análisis financiero.

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

La versión actual no reemplaza los productos ni recalcula el stock desde esta edición. Si una venta fue ingresada con productos equivocados, registre la incidencia antes de realizar correcciones manuales.

## 6. Inventario

### 6.1 Consultar

La pantalla muestra productos activos, categoría, SKU, precio, stock y estado. Puede:

- Buscar por nombre o SKU.
- Filtrar por categoría.
- Mostrar stock bajo.
- Mostrar productos agotados.
- Cambiar de página si existen muchos resultados.

Estados:

- **Normal:** stock superior al umbral de aviso.
- **Stock bajo:** stock positivo e igual o inferior al umbral.
- **Agotado:** stock igual a cero.
- **Sin seguimiento:** el producto no controla existencias.

### 6.2 Crear un producto

1. Pulse **Nuevo producto**.
2. Seleccione una categoría.
3. Ingrese un SKU único, por ejemplo `BEB-015`.
4. Complete nombre, descripción, precio y unidad.
5. Indique stock y umbral de alerta.
6. Active seguimiento de stock cuando corresponda.
7. Guarde y confirme que aparezca en la lista.

El precio se registra en pesos chilenos enteros. El SKU no puede repetirse.

### 6.3 Editar o retirar un producto

Use **Editar** para actualizar sus datos. La opción **Eliminar** realiza una desactivación lógica: el producto deja de aparecer, pero su historial se conserva.

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
- **Inventario valorizado:** stock por costo unitario de productos activos.
- **Mermas:** costo de movimientos clasificados como pérdida o merma.

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
| Sesión vencida | Vuelva a iniciar sesión. |
| Producto no se guarda | Revise campos obligatorios, SKU duplicado y valores negativos. |
| Venta rechazada | Revise selecciones obligatorias y stock disponible. |
| Datos financieros incompletos | Verifique costos, gastos y ventas registrados en el período. |
| Error de API | Anote mensaje, hora y acción; entregue esos datos a soporte. |

## 10. Alcance y límites conocidos

- Los perfiles ADMIN y CASHIER se muestran, pero todavía poseen los mismos permisos técnicos.
- La edición de una venta no sustituye sus productos.
- No existe recuperación de contraseña desde la interfaz.
- La instalación local usa HTTP; no debe exponerse a Internet sin HTTPS y endurecimiento de seguridad.
- Las cuentas y datos seed son de demostración.

## 11. Evaluación del manual

El manual fue contrastado con la interfaz y las rutas implementadas. Un usuario nuevo puede completar los recorridos esenciales en este orden:

1. Entrar y reconocer la navegación.
2. Consultar stock y crear un producto.
3. Armar un menú, agregar un producto individual y confirmar una venta.
4. Encontrar y modificar los datos generales de esa venta.
5. Registrar un gasto y exportar finanzas.
6. Cerrar sesión y reconocer cuándo solicitar soporte.

La terminología coincide con las pantallas actuales y los límites relevantes están señalados antes de que el usuario dependa de una función inexistente. Recomendación para la próxima versión: añadir capturas numeradas cuando la interfaz visual se estabilice y separar un manual breve para caja.
