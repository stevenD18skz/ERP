-- =============================================================================
-- DESTRUCTIVO · Borra el esquema completo de Boxes
-- =============================================================================
-- Esto elimina las tablas de negocio con todo lo que tengan adentro: ventas,
-- pedidos, gastos, cierres, catálogo, categorías y marcas. No hay deshacer.
--
-- Sirve para volver a empezar de cero mientras se está armando el proyecto:
-- correr este archivo y después la carpeta en orden numérico (01, 06, 07, 08,
-- 09, seed-tiendas.mjs, 10, 11, 12).
--
-- No borra `tiendas`: las contraseñas y los dueños sobreviven al reset, que es
-- casi siempre lo que se quiere. Para llevárselas también hay que borrarla a
-- mano, sabiendo que después toca volver a correr scripts/seed-tiendas.mjs.
--
-- Está en 99 y no en 00 justamente para que no se ejecute por costumbre al ir
-- de arriba abajo por la carpeta.
-- =============================================================================

drop function if exists public.get_summary(date, date);
drop function if exists public.cancel_order(uuid, boolean);
drop function if exists public.receive_order(uuid, boolean, boolean);
drop function if exists public.create_order(jsonb, jsonb);
drop function if exists public.void_sale(uuid, boolean);
drop function if exists public.create_sale(jsonb, jsonb, boolean);

drop view if exists public.v_products;
drop view if exists public.v_product_categories;
drop view if exists public.v_product_brands;
drop view if exists public.v_monthly_summary;
drop view if exists public.v_sales_daily;

drop table if exists public.sale_items;
drop table if exists public.order_items;
drop table if exists public.sales;
drop table if exists public.orders;
drop table if exists public.expenses;
drop table if exists public.daily_closes;
-- products antes que categories y brands: es el que las referencia.
drop table if exists public.products;
drop table if exists public.categories;
drop table if exists public.brands;

drop function if exists public.set_updated_at();

drop type if exists public.sale_discount_type;
drop type if exists public.daily_close_source;
drop type if exists public.expense_kind;
drop type if exists public.order_status;
drop type if exists public.payment_method;
