# Supabase

Todo lo que necesita la base de datos de Boxes: el esquema y las funciones que
usa la API.

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

### 2. El esquema

En el dashboard: **SQL Editor → New query**, pegar `sql/01_schema.sql` y
darle *Run*. Es el único archivo de esquema que hay — tablas, índices,
vistas, funciones, RLS y el bucket de fotos, todo junto y tal como está hoy
la base. No hay que leer nada más para saber cómo es el esquema.

Después las tiendas, desde la terminal y no desde el SQL Editor (hashea las
contraseñas con el mismo algoritmo que el login, que Postgres no trae):

```bash
node scripts/seed-tiendas.mjs
```

Crea las dos tiendas reales (si no existen ya) y una tienda de demo. Por
último, si se quiere ver la app con contenido:

```sql
-- SQL Editor, después de correr el script de arriba
sql/10_seed_demo.sql
```

Le mete ~32 productos, un par de semanas de ventas y unos cuantos gastos a la
tienda de demo. Nunca toca las tiendas reales — todo el archivo filtra por el
correo de la tienda de demo.

| Opcionales | Cuándo |
|---|---|
| `sql/05_policies_dev.sql` | solo si se quiere consultar Supabase directo desde el navegador. Leer las advertencias del archivo |
| `sql/99_reset.sql` | **destructivo**: borra todas las tablas de negocio para empezar de cero. No toca `tiendas` |

Todo es idempotente: se puede volver a correr sin duplicar filas ni romper
nada.

### 3. Comprobar

Con `npm run dev` corriendo, abrir <http://localhost:3000/api/health>. Con el
esquema listo y sin datos todavía debería responder algo como:

```json
{ "data": { "estado": "vacia", "conteos": { "products": 0, "sales": 0, "expenses": 0 } } }
```

Si dice otra cosa, el mismo mensaje explica qué falta: `sin_configurar` son
las variables de entorno, `sin_esquema` es que falta correr `01_schema.sql`.

## Las tablas

| Tabla | Qué guarda |
|---|---|
| `tiendas` | cada negocio que usa la app. Todo lo demás cuelga de `tienda_id` |
| `products` | catálogo, con categoría y marca opcionales |
| `categories` | las categorías de cada tienda. El producto apunta a una (o a ninguna) |
| `brands` | las marcas de cada tienda, con la misma forma que las categorías |
| `sales` + `sale_items` | ventas registradas venta por venta desde la app |
| `orders` + `order_items` | pedidos a proveedores |
| `expenses` | gastos y movimientos de caja |
| `daily_closes` | cierre diario, para cuando se importa un histórico de contabilidad externo. La app no escribe acá directamente |

### El doble conteo

Si alguna vez se importa un histórico a `daily_closes`, hay dos pares de
columnas que terminan siendo el mismo dinero contado de dos formas:

- `daily_closes.expenses_total` ≡ las filas `kind = 'gasto'` de `expenses`
- `daily_closes.sales_total` ≡ lo que sume `sales`

Al sumar hay que usar una fuente o la otra, nunca las dos. Por eso
`get_summary()` las devuelve separadas.

## Las funciones

`supabase-js` no puede abrir una transacción desde el cliente, así que todo lo
que toca dos tablas a la vez vive en una función SQL. Se llaman con `.rpc()`
desde las rutas de `/api`, y todas piden `p_tienda_id` explícito: es lo que
impide que una tienda toque los datos de otra.

| Función | Qué hace |
|---|---|
| `create_sale(p_sale, p_items, p_tienda_id, p_adjust_stock)` | inserta la venta y sus líneas, calcula total y ganancia, descuenta el inventario |
| `void_sale(p_sale_id, p_tienda_id, p_restore_stock)` | anula una venta y devuelve la mercancía |
| `create_order(p_order, p_items, p_tienda_id)` | crea el pedido y calcula su total |
| `receive_order(p_order_id, p_tienda_id, p_adjust_stock, p_update_cost)` | lo marca recibido y suma el inventario |
| `cancel_order(p_order_id, p_tienda_id, p_adjust_stock)` | lo cancela y, si ya estaba recibido, descuenta lo que había sumado |
| `get_summary(p_tienda_id, p_from, p_to)` | todos los indicadores del tablero en una consulta |

El total y la ganancia de una venta **no** se toman de lo que mande el cliente:
los calcula `create_sale` con las líneas y el `cost_price` del catálogo.

## Seguridad

RLS está activo en las diez tablas y **sin políticas**. Eso significa que la
clave `anon` —la que viaja al navegador— no puede leer ni escribir nada. Todo
pasa por las rutas de `/api`, que se conectan desde el servidor con la
`service_role`, que se salta RLS.

Las vistas `v_products`, `v_product_categories`, `v_product_brands`,
`v_sales_daily` y `v_monthly_summary` se crean con `security_invoker = true`.
Sin eso una vista se consulta con los permisos de quien la creó y se salta el
RLS de las tablas de abajo: sería una puerta de atrás al catálogo entero.

`05_policies_dev.sql` abre todo eso para poder consultar Supabase directo desde
el navegador mientras se desarrolla. Con él corriendo, cualquiera que abra la
aplicación puede leer los precios y las ventas del negocio, y borrar tablas
enteras desde la consola. **Si se corre, hay que revertirlo antes de publicar**
con el bloque comentado al final de ese mismo archivo.
