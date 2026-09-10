# Modelo entidad-relación — Buen Plato

Este documento describe la estructura lógica inicial de la base de datos. El
modelo está orientado a productos, menús configurables, ventas e inventario.

## Diagrama MER

```mermaid
erDiagram
    APP_USERS {
        bigint id PK
        varchar email UK
        varchar display_name
        varchar password_hash
        varchar role
        boolean active
        timestamptz created_at
    }

    CATEGORIES {
        bigint id PK
        varchar name
        varchar slug UK
        varchar category_type
        integer display_order
        boolean active
    }

    PRODUCTS {
        bigint id PK
        bigint category_id FK
        varchar sku UK
        varchar name
        varchar description
        integer price
        integer unit_cost
        varchar unit
        decimal stock
        decimal low_stock_threshold
        boolean track_stock
        boolean active
        timestamptz created_at
        timestamptz updated_at
    }

    MENUS {
        bigint id PK
        varchar name
        varchar description
        integer base_price
        date available_from
        date available_to
        boolean active
        timestamptz created_at
    }

    MENU_SECTIONS {
        bigint id PK
        bigint menu_id FK
        bigint category_id FK
        varchar label
        integer minimum_selections
        integer maximum_selections
        boolean required
        integer display_order
    }

    MENU_OPTIONS {
        bigint id PK
        bigint menu_section_id FK
        bigint product_id FK
        integer extra_price
        boolean active
    }

    ORDERS {
        bigint id PK
        varchar order_number UK
        varchar customer_name
        varchar channel
        varchar service_type
        varchar status
        varchar payment_method
        varchar payment_status
        integer subtotal
        integer total
        varchar notes
        bigint created_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    ORDER_ITEMS {
        bigint id PK
        bigint order_id FK
        bigint product_id FK
        bigint menu_id FK
        varchar item_type
        varchar item_name
        integer quantity
        integer unit_price
        integer total_price
        integer unit_cost
        integer total_cost
        text selections_json
    }

    INVENTORY_MOVEMENTS {
        bigint id PK
        bigint product_id FK
        bigint order_id FK
        varchar movement_type
        decimal quantity
        decimal previous_stock
        decimal resulting_stock
        varchar reason
        bigint created_by FK
        timestamptz created_at
    }

    EXPENSES {
        bigint id PK
        varchar reference_code UK
        date expense_date
        varchar category
        varchar description
        varchar expense_type
        integer amount
        varchar payment_method
        bigint created_by FK
        timestamptz created_at
    }

    CATEGORIES ||--o{ PRODUCTS : clasifica
    MENUS ||--|{ MENU_SECTIONS : contiene
    CATEGORIES ||--o{ MENU_SECTIONS : define
    MENU_SECTIONS ||--o{ MENU_OPTIONS : ofrece
    PRODUCTS ||--o{ MENU_OPTIONS : participa

    APP_USERS ||--o{ ORDERS : registra
    ORDERS ||--|{ ORDER_ITEMS : contiene
    PRODUCTS ||--o{ ORDER_ITEMS : producto_vendido
    MENUS ||--o{ ORDER_ITEMS : menu_vendido

    PRODUCTS ||--o{ INVENTORY_MOVEMENTS : genera
    ORDERS ||--o{ INVENTORY_MOVEMENTS : origina
    APP_USERS ||--o{ INVENTORY_MOVEMENTS : registra
    APP_USERS ||--o{ EXPENSES : registra
```

## Lectura de las relaciones

| Relación | Cardinalidad | Significado |
|---|---:|---|
| Categoría → Producto | 1 a 0..N | Una categoría puede clasificar varios productos; cada producto pertenece a una categoría. |
| Menú → Sección | 1 a 1..N | Un menú debe contener una o más secciones configurables. |
| Categoría → Sección | 1 a 0..N | Una sección representa una categoría, como proteína o ensalada. |
| Sección → Opción | 1 a 0..N | Una sección puede ofrecer varios productos para seleccionar. |
| Producto → Opción | 1 a 0..N | Un producto puede participar en diferentes menús o secciones. |
| Usuario → Pedido | 1 a 0..N | Un usuario puede registrar muchos pedidos. |
| Pedido → Ítem | 1 a 1..N | Todo pedido confirmado debe contener al menos un ítem. |
| Producto → Ítem | 1 a 0..N | Un ítem puede representar un producto vendido por separado. |
| Menú → Ítem | 1 a 0..N | Un ítem puede representar un menú configurado. |
| Producto → Movimiento | 1 a 0..N | Cada entrada o salida de stock pertenece a un producto. |
| Pedido → Movimiento | 1 a 0..N | Una venta puede originar varios descuentos de inventario. |
| Usuario → Movimiento | 1 a 0..N | Los ajustes manuales conservan al usuario responsable. |
| Usuario → Gasto | 1 a 0..N | Los gastos operacionales conservan al usuario que los registró. |

## Responsabilidad de cada entidad

### `app_users`

Personas autorizadas para utilizar el sistema administrativo. El campo `role`
permitirá distinguir administrador, cajero, cocina y encargado de inventario.

### `categories`

Clasifica productos y define los tipos de componentes de un menú. Ejemplos:
proteína, agregado, ensalada, postre, bebida y extra.

### `products`

Catálogo único de elementos vendibles o seleccionables. Contiene precio
individual, unidad de control, stock y umbral de alerta.

### `menus`

Define un producto compuesto con precio base y vigencia. Un menú no guarda sus
productos directamente; los organiza mediante secciones y opciones.

### `menu_sections`

Establece las reglas de selección de cada parte del menú. Por ejemplo:
“selecciona exactamente una proteína” o “selecciona hasta dos ensaladas”.

### `menu_options`

Relaciona un producto con una sección del menú. `extra_price` permite aplicar
recargos como carne mechada por `+$1.500`.

### `orders`

Encabezado de la venta. Conserva número, canal, modalidad de atención, estado,
pago y totales definitivos.

### `order_items`

Detalle de productos y menús vendidos. Guarda nombre y precios históricos para
que una modificación posterior del catálogo no altere ventas antiguas.

`selections_json` será una fotografía de las opciones incluidas en un menú
vendido. En una fase posterior se evaluará normalizar esta información en una
tabla `order_item_selections` si se requieren reportes detallados por componente.

Una venta puede contener ítems de tipo `MENU` y varios ítems de tipo `PRODUCT`:

- Una línea `MENU` puede representar varios almuerzos mediante `quantity`.
- `selections_json` guarda cada opción elegida con su cantidad explícita. Por
  ejemplo: 3 menús, 2 porciones de pollo y 1 de carne.
- En cada sección, la suma de cantidades debe cumplir
  `minimum_selections × quantity` y `maximum_selections × quantity`.
- De esta forma, las proteínas, agregados, ensaladas y postres se distribuyen
  dentro de una sola línea y no se repiten visualmente en el pedido.
- La bebida se registra como un ítem `PRODUCT` aparte.
- Cualquier producto activo puede agregarse como extra y se registra como un
  ítem `PRODUCT`.
- El inventario descuenta la cantidad exacta de cada opción registrada en
  `selections_json`.

### `inventory_movements`

Libro de movimientos del inventario. Registra compras, ventas, mermas, ajustes,
devoluciones y sus existencias anterior y resultante.

### `expenses`

Registra egresos fijos y variables del local. Junto con el costo histórico
guardado en `order_items`, permite calcular utilidad bruta, resultado
operacional y punto de equilibrio sin depender de valores escritos en el
frontend.

## Claves y abreviaciones

- `PK`: clave primaria.
- `FK`: clave foránea.
- `UK`: valor único.
- `1..N`: uno o muchos.
- `0..N`: ninguno o muchos.

## Reglas de integridad

1. Los precios se almacenan como enteros en pesos chilenos.
2. `products.price`, `menus.base_price` y `menu_options.extra_price` no pueden
   ser negativos.
3. Un producto debe pertenecer a una categoría.
4. Una sección no puede repetir la misma categoría dentro de un menú.
5. Un producto no puede repetirse dentro de una misma sección.
6. La selección mínima no puede superar la selección máxima.
7. Un ítem debe apuntar a un producto o a un menú según `item_type`.
8. Un pedido confirmado debe tener al menos un ítem.
9. El total se calcula en el backend usando precios vigentes.
10. La creación del pedido y los movimientos de inventario se ejecutan en una
    única transacción.
11. El stock no puede quedar negativo, salvo que en el futuro se habilite una
    política explícita de sobreventa.
12. Las ventas históricas no deben cambiar cuando se actualice un precio.
13. Los registros utilizados históricamente se desactivan en lugar de borrarse.
14. Un pedido puede incluir cero o más menús configurados y cero o más productos
    adicionales, pero siempre debe contener al menos uno de ellos.
15. Cada menú del pedido debe cumplir de forma independiente los mínimos y
    máximos definidos por sus secciones.
16. Bebidas y productos extra no forman parte del precio base del menú.

## Estados propuestos

### Pedido

```text
PENDING → PAID → PREPARING → READY → COMPLETED
                  ↘ CANCELLED
```

### Pago

```text
PENDING → PAID → REFUNDED
```

### Tipos de movimiento

- `PURCHASE`: ingreso por compra o producción.
- `SALE`: salida asociada a una venta.
- `ADJUSTMENT`: corrección manual.
- `WASTE`: merma.
- `RETURN`: devolución al inventario.

## Posibles ampliaciones

Estas entidades no se incorporan todavía para mantener un primer modelo
manejable:

- `customers`: clientes registrados y datos de contacto.
- `payments`: múltiples intentos o pagos parciales por pedido.
- `order_item_selections`: selecciones normalizadas para análisis detallado.
- `locations`: soporte para múltiples locales.
- `recipes` y `ingredients`: inventario por ingrediente en lugar de porción.
- `cash_sessions`: apertura, cierre y arqueo de caja.
- `audit_log`: auditoría general de acciones administrativas.
- `tax_documents`: boletas y documentos tributarios electrónicos.

Su incorporación se realizará solamente cuando el flujo funcional lo requiera.
