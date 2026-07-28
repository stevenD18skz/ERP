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
en orden numérico. Primero el esquema:

| Archivo | Qué hace |
|---|---|
| `sql/01_schema.sql` | tablas, índices, vistas, funciones y RLS |
| `sql/06_tiendas.sql` | agrega la entidad tienda y `tienda_id` en cada tabla |
| `sql/07_tiendas_notnull.sql` | exige `tienda_id` |
| `sql/08_products_sku_por_tienda.sql` | el SKU pasa a ser opcional y único por tienda |
| `sql/09_categorias_y_marcas.sql` | categoría y marca pasan a ser tablas propias; `products.category` se convierte y se borra |

El `01` es el punto de partida de 2025 y quedó tal cual: del `06` al `09` está
lo que fue cambiando desde entonces. No hay `02`, `03` ni `04` — eran las
semillas y pasaron a numerarse `10`, `11` y `12`, que es donde de verdad van.

Después las tiendas, desde la terminal y no desde el SQL Editor (hashea las
contraseñas con el mismo algoritmo que el login):

```bash
node scripts/seed-tiendas.mjs
```

Y de último las semillas, si se quieren los datos de 2025:

| Archivo | Qué hace |
|---|---|
| `sql/10_seed_products.sql` | 19 categorías y 435 productos del catálogo |
| `sql/11_seed_daily_closes.sql` | 365 cierres diarios de 2025 |
| `sql/12_seed_expenses.sql` | 522 gastos y movimientos de caja |

Todo se puede volver a correr sin romper nada ni duplicar filas. Cada semilla
comprueba al empezar que el esquema y la tienda existan, y se planta con un
mensaje claro si le falta algo: sin esa comprobación, correrlas antes de tiempo
insertaría cero filas y Supabase diría *"Success. No rows returned"*.

Las tres entran a la tienda **Jose's Market**, que es de donde salió el Excel;
The Sunny Go arranca vacía. Ni `tienda_id` ni `category_id` van escritos en el
archivo: se buscan por nombre al correrlo, así que los mismos archivos sirven en
cualquier proyecto de Supabase.

La **marca** queda vacía en los 435 productos: el Excel no la traía y no se
inventa. Se llena a mano o al escanear el código de barras.

| Opcionales | Cuándo |
|---|---|
| `sql/05_policies_dev.sql` | solo si se quiere consultar Supabase directo desde el navegador. Leer las advertencias del archivo |
| `sql/99_reset.sql` | **destructivo**: borra todas las tablas de negocio para empezar de cero. No toca `tiendas` |

### 3. Comprobar

Con `npm run dev` corriendo, abrir <http://localhost:3000/api/health>. Debería
responder:

```json
{ "data": { "estado": "ok", "conteos": { "products": 435, "expenses": 522, "daily_closes": 365 } } }
```

Si dice otra cosa, el mismo mensaje explica qué falta: `sin_configurar` son las
variables de entorno, `sin_esquema` es que falta el esquema, y `vacia` es que
las tablas existen pero no tienen datos —que es normal si no se corrieron las
semillas y se va a cargar el catálogo desde la propia aplicación.

## Las tablas

| Tabla | Qué guarda |
|---|---|
| `products` | catálogo. Del Excel salieron solo nombre y precio |
| `categories` | las categorías de cada tienda. El producto apunta a una (o a ninguna) |
| `brands` | las marcas de cada tienda, con la misma forma que las categorías |
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

RLS está activo en las diez tablas y **sin políticas**. Eso significa que la
clave `anon` —la que viaja al navegador— no puede leer ni escribir nada. Todo
pasa por las rutas de `/api`, que se conectan desde el servidor con la
`service_role`, que se salta RLS.

Las vistas `v_products`, `v_product_categories` y `v_product_brands` se crean
con `security_invoker = true`. Sin eso una vista se consulta con los permisos de
quien la creó y se salta el RLS de las tablas de abajo: sería una puerta de
atrás al catálogo entero.

`05_policies_dev.sql` abre todo eso para poder consultar Supabase directo desde
el navegador mientras se desarrolla. Con él corriendo, cualquiera que abra la
aplicación puede leer los precios y las ventas del negocio, y borrar tablas
enteras desde la consola. **Si se corre, hay que revertirlo antes de publicar**
con el bloque comentado al final de ese mismo archivo.

## Regenerar las semillas

Los archivos `10`, `11` y `12` están generados: salen de `src/lib/data/*.data.ts`,
que a su vez salen del Excel.

```bash
npm run import:excel   # Excel_PA/*.csv  -> src/lib/data/*.data.ts
npm run sql:generate   # src/lib/data/*  -> supabase/sql/1{0,1,2}_seed_*.sql
```

Los `id` son UUID v5 derivados del sku del producto, de la fecha del cierre y
del id del gasto: no cambian entre corridas, y por eso volver a ejecutar una
semilla no duplica nada.

Volver a correr una semilla tampoco **actualiza** lo que ya está en la base
(`on conflict do nothing`). Para reimportar de verdad hay que borrar la tabla
primero, sabiendo que eso se lleva el stock contado a mano.

A qué tienda entran los datos se decide en la constante `TIENDA` de
`scripts/generate-sql/index.mjs`. Cambiarla y volver a generar es lo único que
hace falta para sembrar otro negocio.
