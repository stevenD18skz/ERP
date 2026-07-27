-- =============================================================================
-- DESTRUCTIVO · Borra el esquema completo del ERP
-- =============================================================================
-- Esto elimina las siete tablas con todo lo que tengan adentro: ventas,
-- pedidos, gastos, cierres y catálogo. No hay deshacer.
--
-- Sirve para volver a empezar de cero mientras se está armando el proyecto:
-- correr este archivo y después 01 -> 02 -> 03 -> 04.
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

drop view if exists public.v_product_categories;
drop view if exists public.v_monthly_summary;
drop view if exists public.v_sales_daily;

drop table if exists public.sale_items;
drop table if exists public.order_items;
drop table if exists public.sales;
drop table if exists public.orders;
drop table if exists public.expenses;
drop table if exists public.daily_closes;
drop table if exists public.products;

drop function if exists public.set_updated_at();

drop type if exists public.sale_discount_type;
drop type if exists public.daily_close_source;
drop type if exists public.expense_kind;
drop type if exists public.order_status;
drop type if exists public.payment_method;
