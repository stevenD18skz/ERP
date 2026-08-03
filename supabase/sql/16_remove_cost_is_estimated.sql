-- =============================================================================
-- Boxes · Quita cost_is_estimated
-- =============================================================================
-- Ejecutar después de 15_tienda_settings.sql. Es idempotente.
--
-- La bandera "costo estimado" (precio x 0.81, el margen del 19% que usaba la
-- contabilidad del Excel) ya no se distingue en la UI ni se guarda. Antes de
-- soltar la columna hay que quitarle la referencia a las dos funciones que la
-- usaban -si no, quedarían rotas en cuanto la columna desapareciera-, así que
-- primero van los create or replace y al final el alter table.
--
-- Los cuerpos de acá son los mismos que dejó 06_tiendas.sql (que fue el que le
-- agregó p_tienda_id a las dos), menos las líneas de cost_is_estimated. La
-- vista v_products también la nombraba (es de donde lee la API, ver
-- src/lib/api/taxonomy.ts) y hay que recrearla antes del drop column, si no
-- Postgres se niega: "other objects depend on it".
-- =============================================================================

-- create or replace view no sirve para quitar una columna (Postgres solo deja
-- agregar al final con eso); toca soltarla y volver a crearla.
drop view if exists public.v_products;
create view public.v_products as
select
  p.id,
  p.name,
  p.sku,
  p.barcode,
  p.photo,
  p.price,
  p.cost_price,
  p.stock,
  p.description,
  p.created_at,
  p.updated_at,
  p.tienda_id,
  p.category_id,
  p.brand_id,
  c.name as category,
  b.name as brand
from products p
left join categories c on c.id = p.category_id
left join brands b on b.id = p.brand_id;

create or replace function public.receive_order(
  p_order_id     uuid,
  p_tienda_id    uuid,
  p_adjust_stock boolean default true,
  p_update_cost  boolean default false
)
returns public.orders
language plpgsql
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id and tienda_id = p_tienda_id;
  if not found then
    raise exception 'Pedido no encontrado' using errcode = 'P0002';
  end if;
  if v_order.status = 'recibido' then
    return v_order;
  end if;
  if v_order.status = 'cancelado' then
    raise exception 'El pedido está cancelado y no se puede recibir'
      using errcode = '22023';
  end if;

  if p_adjust_stock then
    update public.products p
    set stock = p.stock + agg.qty
    from (
      select oi.product_id, sum(oi.quantity) as qty
      from public.order_items oi
      where oi.order_id = p_order_id and oi.product_id is not null
      group by oi.product_id
    ) agg
    where p.id = agg.product_id and p.tienda_id = p_tienda_id;
  end if;

  if p_update_cost then
    update public.products p
    set cost_price = agg.cost
    from (
      select oi.product_id, max(oi.unit_cost) as cost
      from public.order_items oi
      where oi.order_id = p_order_id and oi.product_id is not null and oi.unit_cost > 0
      group by oi.product_id
    ) agg
    where p.id = agg.product_id and p.tienda_id = p_tienda_id;
  end if;

  update public.orders
  set status = 'recibido', received_at = now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

create or replace function public.get_summary(
  p_tienda_id uuid,
  p_from      date default null,
  p_to        date default null
)
returns jsonb
language sql
stable
as $$
with rango as (
  select
    coalesce(p_from, (select min(dc.date) from public.daily_closes dc where dc.tienda_id = p_tienda_id), current_date - 29) as f,
    coalesce(p_to, greatest(current_date, (select max(dc.date) from public.daily_closes dc where dc.tienda_id = p_tienda_id))) as t
)
select jsonb_build_object(
  'range', (select jsonb_build_object('from', r.f, 'to', r.t) from rango r),

  'daily_closes', (
    select jsonb_build_object(
      'days',            count(*),
      'sales_total',     coalesce(sum(dc.sales_total), 0),
      'gain',            coalesce(sum(dc.gain), 0),
      'expenses_total',  coalesce(sum(dc.expenses_total), 0),
      'purchases_total', coalesce(sum(dc.purchases_total), 0),
      'cash_in',         coalesce(sum(dc.cash_in), 0),
      'cash_out',        coalesce(sum(dc.cash_out), 0)
    )
    from public.daily_closes dc, rango r
    where dc.tienda_id = p_tienda_id
      and dc.date between r.f and r.t
  ),

  'sales', (
    select jsonb_build_object(
      'count',        count(*),
      'total_amount', coalesce(sum(s.total_amount), 0),
      'gain',         coalesce(sum(s.gain), 0),
      'ticket_avg',   coalesce(round(avg(s.total_amount), 2), 0)
    )
    from public.sales s, rango r
    where not s.voided
      and s.tienda_id = p_tienda_id
      and (s.sale_date at time zone 'America/Bogota')::date between r.f and r.t
  ),

  'sales_by_payment_method', (
    select coalesce(jsonb_object_agg(x.payment_method, x.total), '{}'::jsonb)
    from (
      select s.payment_method::text as payment_method, coalesce(sum(s.total_amount), 0) as total
      from public.sales s, rango r
      where not s.voided
        and s.tienda_id = p_tienda_id
        and (s.sale_date at time zone 'America/Bogota')::date between r.f and r.t
      group by 1
    ) x
  ),

  'expenses', (
    select coalesce(jsonb_object_agg(x.kind, x.total), '{}'::jsonb)
    from (
      select e.kind::text as kind, coalesce(sum(e.amount), 0) as total
      from public.expenses e, rango r
      where e.tienda_id = p_tienda_id
        and e.date between r.f and r.t
      group by 1
    ) x
  ),

  'orders', (
    select jsonb_build_object(
      'total',           count(*),
      'pendientes',      count(*) filter (where o.status = 'pendiente'),
      'recibidos',       count(*) filter (where o.status = 'recibido'),
      'cancelados',      count(*) filter (where o.status = 'cancelado'),
      'monto_pendiente', coalesce(sum(o.total_amount) filter (where o.status = 'pendiente'), 0),
      'atrasados',       count(*) filter (
        where o.status = 'pendiente'
          and o.expected_delivery is not null
          and o.expected_delivery < current_date
      )
    )
    from public.orders o, rango r
    where o.tienda_id = p_tienda_id
      and (o.order_date at time zone 'America/Bogota')::date between r.f and r.t
  ),

  'inventory', (
    select jsonb_build_object(
      'products',          count(*),
      'sin_stock',         count(*) filter (where p.stock <= 0),
      'stock_bajo',        count(*) filter (where p.stock > 0 and p.stock <= 10),
      'valor_costo',       coalesce(sum(p.stock * p.cost_price), 0),
      'valor_venta',       coalesce(sum(p.stock * p.price), 0)
    )
    from public.products p
    where p.tienda_id = p_tienda_id
  ),

  'monthly', (
    select coalesce(jsonb_agg(to_jsonb(m) order by m.month), '[]'::jsonb)
    from public.v_monthly_summary m, rango r
    where m.tienda_id = p_tienda_id
      and m.month between to_char(r.f, 'YYYY-MM') and to_char(r.t, 'YYYY-MM')
  ),

  'top_products', (
    select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
    from (
      select
        si.product_id,
        si.product_name,
        sum(si.quantity)   as quantity,
        sum(si.line_total) as total
      from public.sale_items si
      join public.sales s on s.id = si.sale_id, rango r
      where not s.voided
        and s.tienda_id = p_tienda_id
        and (s.sale_date at time zone 'America/Bogota')::date between r.f and r.t
      group by si.product_id, si.product_name
      order by 3 desc
      limit 5
    ) x
  )
);
$$;

alter table public.products drop column if exists cost_is_estimated;
