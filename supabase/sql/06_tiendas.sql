-- =============================================================================
-- ERP Supermercado · Multi-tienda
-- =============================================================================
-- Ejecutar después de 01_schema.sql. Es idempotente: se puede volver a correr
-- sin romper nada.
--
-- Agrega la entidad "tienda" (nombre + dueño + password) y una columna
-- tienda_id en cada tabla de negocio. tienda_id queda NULLABLE aquí a
-- propósito: el backfill de los datos existentes (ver scripts/seed-tiendas.mjs)
-- pasa después de correr este archivo, y solo entonces se corre
-- 07_tiendas_notnull.sql para exigir el valor.
--
-- No hay Supabase Auth ni RLS por identidad: todo el acceso pasa por las
-- rutas de /api con la service_role key (igual que el resto del esquema), así
-- que el aislamiento entre tiendas vive en las rutas y en estas funciones, no
-- en políticas de RLS.
-- =============================================================================

-- ============================================================== TIENDAS =====
create table if not exists public.tiendas (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null check (length(btrim(nombre)) > 0),
  dueno         text not null check (length(btrim(dueno)) > 0),
  password_hash text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Login por nombre sin importar mayúsculas/minúsculas.
create unique index if not exists tiendas_nombre_lower_idx
  on public.tiendas (lower(nombre));

drop trigger if exists tiendas_set_updated_at on public.tiendas;
create trigger tiendas_set_updated_at
  before update on public.tiendas
  for each row execute function public.set_updated_at();

alter table public.tiendas enable row level security;

-- ======================================================== TIENDA_ID ==========
alter table public.products     add column if not exists tienda_id uuid references public.tiendas(id);
alter table public.sales        add column if not exists tienda_id uuid references public.tiendas(id);
alter table public.orders       add column if not exists tienda_id uuid references public.tiendas(id);
alter table public.expenses     add column if not exists tienda_id uuid references public.tiendas(id);
alter table public.daily_closes add column if not exists tienda_id uuid references public.tiendas(id);

create index if not exists products_tienda_id_idx     on public.products (tienda_id);
create index if not exists sales_tienda_id_idx         on public.sales (tienda_id);
create index if not exists orders_tienda_id_idx        on public.orders (tienda_id);
create index if not exists expenses_tienda_id_idx      on public.expenses (tienda_id);
create index if not exists daily_closes_tienda_id_idx  on public.daily_closes (tienda_id);

-- daily_closes tenía "date unique" a nivel global (un cierre por fecha en toda
-- la base). Con varias tiendas, la fecha se repite entre tiendas y lo único
-- que no se puede repetir es (tienda_id, date). NULL no rompe la unicidad,
-- así que esto no falla aunque tienda_id todavía no tenga backfill.
alter table public.daily_closes drop constraint if exists daily_closes_date_key;
alter table public.daily_closes drop constraint if exists daily_closes_tienda_date_key;
alter table public.daily_closes add constraint daily_closes_tienda_date_key unique (tienda_id, date);

-- =============================================================== VISTAS ======
-- create or replace view no deja insertar una columna nueva antes de las que
-- ya existían (cambia el orden), así que se recrean desde cero. El cascade
-- también tumba get_summary(), que se vuelve a crear más abajo.
drop view if exists public.v_sales_daily cascade;
drop view if exists public.v_monthly_summary cascade;
drop view if exists public.v_product_categories cascade;

create view public.v_sales_daily as
select
  s.tienda_id,
  (s.sale_date at time zone 'America/Bogota')::date as date,
  count(*)                          as sales_count,
  coalesce(sum(s.total_amount), 0)  as sales_total,
  coalesce(sum(s.gain), 0)          as gain
from public.sales s
where not s.voided
group by 1, 2;

create view public.v_monthly_summary as
select
  dc.tienda_id,
  to_char(date_trunc('month', dc.date), 'YYYY-MM') as month,
  count(*)                             as days,
  coalesce(sum(dc.sales_total), 0)     as sales_total,
  coalesce(sum(dc.gain), 0)            as gain,
  coalesce(sum(dc.expenses_total), 0)  as expenses_total,
  coalesce(sum(dc.purchases_total), 0) as purchases_total
from public.daily_closes dc
group by 1, 2;

create view public.v_product_categories as
select
  p.tienda_id,
  p.category,
  count(*)                                   as product_count,
  coalesce(sum(p.stock), 0)                  as stock_units,
  coalesce(sum(p.stock * p.cost_price), 0)   as stock_value_cost
from public.products p
group by 1, 2;

-- =========================================================== FUNCIONES ======
-- Cambiar la lista de parámetros crea un overload nuevo en vez de reemplazar
-- el existente, así que hay que borrar la firma vieja primero.
drop function if exists public.create_sale(jsonb, jsonb, boolean);
drop function if exists public.void_sale(uuid, boolean);
drop function if exists public.create_order(jsonb, jsonb);
drop function if exists public.receive_order(uuid, boolean, boolean);
drop function if exists public.cancel_order(uuid, boolean);
drop function if exists public.get_summary(date, date);

create or replace function public.create_sale(
  p_sale         jsonb,
  p_items        jsonb,
  p_tienda_id    uuid,
  p_adjust_stock boolean default true
)
returns public.sales
language plpgsql
as $$
declare
  v_sale public.sales;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La venta necesita al menos una línea de producto'
      using errcode = '22023';
  end if;

  insert into public.sales (tienda_id, sale_date, payment_method, client_name, voided)
  values (
    p_tienda_id,
    coalesce((p_sale->>'sale_date')::timestamptz, now()),
    coalesce((p_sale->>'payment_method')::public.payment_method, 'efectivo'),
    nullif(btrim(coalesce(p_sale->>'client_name', '')), ''),
    coalesce((p_sale->>'voided')::boolean, false)
  )
  returning * into v_sale;

  insert into public.sale_items (
    sale_id, product_id, product_name, quantity, sale_price, discount_type, discount_value
  )
  select
    v_sale.id,
    p.id,
    coalesce(nullif(btrim(coalesce(it->>'product', '')), ''), p.name, 'Producto sin registrar'),
    coalesce((it->>'quantity')::numeric, 0),
    coalesce((it->>'sale_price')::numeric, p.price, 0),
    nullif(it->>'discount_type', '')::public.sale_discount_type,
    coalesce((it->>'discount_value')::numeric, 0)
  from jsonb_array_elements(p_items) as it
  left join public.products p
    on p.id = nullif(it->>'product_id', '')::uuid
   and p.tienda_id = p_tienda_id;

  update public.sales s
  set total_amount = t.total,
      gain         = t.total - t.cost
  from (
    select
      coalesce(sum(si.line_total), 0)                          as total,
      coalesce(sum(si.quantity * coalesce(p.cost_price, 0)), 0) as cost
    from public.sale_items si
    left join public.products p on p.id = si.product_id
    where si.sale_id = v_sale.id
  ) t
  where s.id = v_sale.id
  returning s.* into v_sale;

  if p_adjust_stock and not v_sale.voided then
    update public.products p
    set stock = p.stock - agg.qty
    from (
      select si.product_id, sum(si.quantity) as qty
      from public.sale_items si
      where si.sale_id = v_sale.id and si.product_id is not null
      group by si.product_id
    ) agg
    where p.id = agg.product_id and p.tienda_id = p_tienda_id;
  end if;

  return v_sale;
end;
$$;

create or replace function public.void_sale(
  p_sale_id       uuid,
  p_tienda_id     uuid,
  p_restore_stock boolean default true
)
returns public.sales
language plpgsql
as $$
declare
  v_sale public.sales;
begin
  select * into v_sale from public.sales where id = p_sale_id and tienda_id = p_tienda_id;
  if not found then
    raise exception 'Venta no encontrada' using errcode = 'P0002';
  end if;
  if v_sale.voided then
    return v_sale;
  end if;

  if p_restore_stock then
    update public.products p
    set stock = p.stock + agg.qty
    from (
      select si.product_id, sum(si.quantity) as qty
      from public.sale_items si
      where si.sale_id = p_sale_id and si.product_id is not null
      group by si.product_id
    ) agg
    where p.id = agg.product_id and p.tienda_id = p_tienda_id;
  end if;

  update public.sales
  set voided = true, voided_at = now()
  where id = p_sale_id
  returning * into v_sale;

  return v_sale;
end;
$$;

create or replace function public.create_order(
  p_order     jsonb,
  p_items     jsonb,
  p_tienda_id uuid
)
returns public.orders
language plpgsql
as $$
declare
  v_order public.orders;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido necesita al menos una línea de producto'
      using errcode = '22023';
  end if;

  insert into public.orders (tienda_id, order_date, supplier, expected_delivery, notes, status, attachment)
  values (
    p_tienda_id,
    coalesce((p_order->>'order_date')::timestamptz, now()),
    btrim(coalesce(p_order->>'supplier', '')),
    nullif(p_order->>'expected_delivery', '')::date,
    coalesce(p_order->>'notes', ''),
    coalesce((p_order->>'status')::public.order_status, 'pendiente'),
    nullif(p_order->>'attachment', '')
  )
  returning * into v_order;

  insert into public.order_items (order_id, product_id, product_name, quantity, unit_cost)
  select
    v_order.id,
    p.id,
    coalesce(nullif(btrim(coalesce(it->>'product', '')), ''), p.name, 'Producto sin registrar'),
    coalesce((it->>'quantity')::numeric, 0),
    coalesce((it->>'unit_cost')::numeric, p.cost_price, 0)
  from jsonb_array_elements(p_items) as it
  left join public.products p
    on p.id = nullif(it->>'product_id', '')::uuid
   and p.tienda_id = p_tienda_id;

  update public.orders o
  set total_amount = t.total
  from (
    select coalesce(sum(oi.line_total), 0) as total
    from public.order_items oi
    where oi.order_id = v_order.id
  ) t
  where o.id = v_order.id
  returning o.* into v_order;

  return v_order;
end;
$$;

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
    set cost_price = agg.cost, cost_is_estimated = false
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

create or replace function public.cancel_order(
  p_order_id     uuid,
  p_tienda_id    uuid,
  p_adjust_stock boolean default true
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
  if v_order.status = 'cancelado' then
    return v_order;
  end if;

  if p_adjust_stock and v_order.status = 'recibido' then
    update public.products p
    set stock = p.stock - agg.qty
    from (
      select oi.product_id, sum(oi.quantity) as qty
      from public.order_items oi
      where oi.order_id = p_order_id and oi.product_id is not null
      group by oi.product_id
    ) agg
    where p.id = agg.product_id and p.tienda_id = p_tienda_id;
  end if;

  update public.orders
  set status = 'cancelado', received_at = null
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
      'costo_estimado',    count(*) filter (where p.cost_is_estimated),
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
