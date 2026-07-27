# Supabase

Todo lo que necesita la base de datos del ERP: el esquema, los datos de 2025
que salieron del Excel y las funciones que usa la API.

## Puesta en marcha

### 1. Las claves

Copiar `.env.example` como `.env.local` y llenar los tres valores desde el
dashboard de Supabase (**Project Settings → API**):

| Variable | De dónde sale | Para qué |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | la raíz del proyecto, **sin** `/rest/v1` al final |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / public | clave pública; solo se usa para el chip de estado |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role | con la que `/api` lee y escribe. **Secreta** |

La `service_role` no lleva `NEXT_PUBLIC_` a propósito: existe solo en el
servidor y nunca llega al navegador. Con esa clave se salta RLS y se puede
modificar cualquier tabla.

Después de editar `.env.local` hay que reiniciar `npm run dev`.

### 2. El SQL

En el dashboard: **SQL Editor → New query**, pegar cada archivo y darle *Run*,
en este orden:

| Archivo | Qué hace |
|---|---|
| `sql/01_schema.sql` | tablas, índices, vistas, funciones y RLS |
| `sql/02_seed_products.sql` | 435 productos del catálogo |
| `sql/03_seed_daily_closes.sql` | 365 cierres diarios de 2025 |
| `sql/04_seed_expenses.sql` | 522 gastos y movimientos de caja |

Los cuatro se pueden volver a correr sin romper nada ni duplicar filas.

| Opcionales | Cuándo |
|---|---|
| `sql/05_policies_dev.sql` | solo si se quiere consultar Supabase directo desde el navegador. Leer las advertencias del archivo |
| `sql/99_reset.sql` | **destructivo**: borra las siete tablas para empezar de cero |

### 3. Comprobar

Con `npm run dev` corriendo, abrir <http://localhost:3000/api/health>. Debería
responder:

```json
{ "data": { "estado": "ok", "conteos": { "products": 435, "expenses": 522, "daily_closes": 365 } } }
```

Si dice otra cosa, el mismo mensaje explica qué falta: `sin_configurar` son las
variables de entorno, `sin_esquema` es que falta correr el `01`, y `vacia` es
que faltan las semillas.

## Las tablas

| Tabla | Qué guarda |
|---|---|
| `products` | catálogo. Del Excel salieron solo nombre y precio |
| `sales` + `sale_items` | ventas registradas venta por venta desde la app |
| `orders` + `order_items` | pedidos a proveedores |
| `expenses` | gastos y movimientos de caja |
| `daily_closes` | cierre diario: un día completo por fila, el formato del Excel |

`sales` y `orders` arrancan vacías y no es un error: el Excel de 2025 solo
anotaba un total de venta y un total de compra por día, sin detalle de qué se
vendió, a quién ni a qué proveedor se le compró. Ese histórico está completo en
`daily_closes`; el detalle transacción por transacción empieza el día que se
empiece a usar la aplicación.

### El doble conteo

Hay dos pares de columnas que son el mismo dinero contado de dos formas:

- `daily_closes.expenses_total` ≡ las filas `kind = 'gasto'` de `expenses`
- `daily_closes.sales_total` ≡ lo que de ahora en adelante sume `sales`

Las dos salen de la misma columna del Excel. Al sumar hay que usar una fuente o
la otra, nunca las dos. Por eso `get_summary()` las devuelve separadas.

## Las funciones

`supabase-js` no puede abrir una transacción desde el cliente, así que todo lo
que toca dos tablas a la vez vive en una función SQL. Se llaman con `.rpc()`
desde las rutas de `/api`.

| Función | Qué hace |
|---|---|
| `create_sale(p_sale, p_items, p_adjust_stock)` | inserta la venta y sus líneas, calcula total y ganancia, descuenta el inventario |
| `void_sale(p_sale_id, p_restore_stock)` | anula una venta y devuelve la mercancía |
| `create_order(p_order, p_items)` | crea el pedido y calcula su total |
| `receive_order(p_order_id, p_adjust_stock, p_update_cost)` | lo marca recibido y suma el inventario |
| `cancel_order(p_order_id, p_adjust_stock)` | lo cancela y, si ya estaba recibido, descuenta lo que había sumado |
| `get_summary(p_from, p_to)` | todos los indicadores del tablero en una consulta |

El total y la ganancia de una venta **no** se toman de lo que mande el cliente:
los calcula `create_sale` con las líneas y el `cost_price` del catálogo.

## Seguridad

RLS está activo en las siete tablas y **sin políticas**. Eso significa que la
clave `anon` —la que viaja al navegador— no puede leer ni escribir nada. Todo
pasa por las rutas de `/api`, que se conectan desde el servidor con la
`service_role`.

Si se corre `05_policies_dev.sql`, cualquiera que abra la aplicación puede leer
los precios y las ventas del negocio, y borrar tablas enteras desde la consola
del navegador. Antes de publicar hay que revertirlo con el bloque comentado al
final de ese mismo archivo.

## Regenerar las semillas

Los archivos `02`, `03` y `04` están generados: salen de `src/lib/data/*.data.ts`,
que a su vez salen del Excel.

```bash
npm run import:excel   # Excel_PA/*.csv  -> src/lib/data/*.data.ts
npm run sql:generate   # src/lib/data/*  -> supabase/sql/0{2,3,4}_seed_*.sql
```

Los `id` son UUID v5 derivados del sku del producto, de la fecha del cierre y
del id del gasto: no cambian entre corridas, y por eso volver a ejecutar una
semilla no duplica nada.

Volver a correr una semilla tampoco **actualiza** lo que ya está en la base
(`on conflict do nothing`). Para reimportar de verdad hay que borrar la tabla
primero, sabiendo que eso se lleva el stock contado a mano.
