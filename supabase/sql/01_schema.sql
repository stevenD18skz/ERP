-- =============================================================================
-- ERP Supermercado · Esquema de base de datos (Supabase / PostgreSQL)
-- =============================================================================
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New query -> pegar -> Run.
-- Es idempotente: se puede volver a correr sin romper nada.
--
-- Orden de ejecución de la carpeta supabase/sql. Los números lo dicen todo:
--   01_schema.sql          <- este archivo (tablas, vistas, funciones, RLS)
--   06..09                 <- migraciones: multi-tienda, SKU por tienda,
--                             categorías y marcas
--   node scripts/seed-tiendas.mjs   <- crea las tiendas (va en la terminal)
--   10_seed_products.sql   <- 435 productos del Excel, con sus categorías
--   11_seed_daily_closes.sql <- 365 cierres diarios de 2025
--   12_seed_expenses.sql   <- 522 gastos y movimientos de caja
--   05_policies_dev.sql    <- OPCIONAL, solo si el navegador va a consultar directo
--
-- Este archivo es el punto de partida de 2025 y quedó tal cual: lo que fue
-- cambiando desde entonces vive en las migraciones 06 a 09, que lo corrigen.
-- Por eso acá abajo todavía se lee `category text` en products: el 09 la
-- convierte en una tabla aparte y la borra.
--
-- Modelo de datos, en corto:
--   products                 catálogo. Del Excel solo salieron nombre y precio.
--   sales / sale_items       ventas registradas desde la app (venta por venta).
--   orders / order_items     pedidos a proveedores.
--   expenses                 gastos y movimientos de caja.
--   daily_closes             cierre diario: el formato del Excel de 2025.
--
-- Ojo con el doble conteo: daily_closes.expenses_total es el mismo dinero que
-- las filas kind='gasto' de expenses (ambos vienen de la columna GASTO del
-- Excel). Lo mismo con sales_total vs. la tabla sales. Al sumar, usar una
-- fuente o la otra, nunca las dos. get_summary() las devuelve por separado.
-- =============================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists pg_trgm;    -- búsqueda por nombre con ILIKE

-- ----------------------------------------------------------------- TIPOS ----
-- create type no acepta "if not exists", de ahí los bloques con excepción.
do $$ begin
  create type public.payment_method as enum ('efectivo','tarjeta','transferencia','fiado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('pendiente','recibido','cancelado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.expense_kind as enum ('gasto','entrada','salida');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.daily_close_source as enum ('excel','app');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.sale_discount_type as enum ('pct','amount');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------ updated_at ---------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================== PRODUCTOS ======
create table if not exists public.products (
  id                uuid primary key default gen_random_uuid(),
  name              text not null check (length(btrim(name)) > 0),
  sku               text not null unique,
  barcode           text not null default '',
  photo             text,
  price             numeric(14,2) not null default 0 check (price >= 0),
  cost_price        numeric(14,2) not null default 0 check (cost_price >= 0),
  -- true cuando el costo no viene de una factura sino de precio x 0.81 (el
  -- margen del 19% de la contabilidad). Al corregirlo a mano debe pasar a false.
  cost_is_estimated boolean not null default true,
  -- numeric y no integer: hay producto que se vende por peso.
  -- Se permite negativo a propósito: el Excel no traía inventario, todos los
  -- productos arrancan en 0 y vender antes de contar dejaría el stock en rojo.
  -- Ese rojo es justamente la señal de que falta hacer el conteo.
  stock             numeric(12,3) not null default 0,
  category          text not null default 'Sin categoría',
  description       text not null default '',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);
create index if not exists products_name_trgm_idx on public.products using gin (name gin_trgm_ops);
create index if not exists products_barcode_idx on public.products (barcode) where barcode <> '';

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- =============================================================== VENTAS =====
create table if not exists public.sales (
  id             uuid primary key default gen_random_uuid(),
  sale_date      timestamptz not null default now(),
  total_amount   numeric(14,2) not null default 0 check (total_amount >= 0),
  gain           numeric(14,2) not null default 0,
  payment_method public.payment_method not null default 'efectivo',
  client_name    text,
  voided         boolean not null default false,
  voided_at      timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- El fiado sin nombre de cliente no se puede cobrar.
  constraint sales_fiado_needs_client
    check (payment_method <> 'fiado' or nullif(btrim(coalesce(client_name,'')),'') is not null)
);

create index if not exists sales_sale_date_idx on public.sales (sale_date desc);
create index if not exists sales_payment_method_idx on public.sales (payment_method);
create index if not exists sales_client_name_idx on public.sales (client_name) where client_name is not null;

drop trigger if exists sales_set_updated_at on public.sales;
create trigger sales_set_updated_at
  before update on public.sales
  for each row execute function public.set_updated_at();

create table if not exists public.sale_items (
  id             uuid primary key default gen_random_uuid(),
  sale_id        uuid not null references public.sales(id) on delete cascade,
  -- on delete set null: borrar un producto del catálogo no puede borrar el
  -- historial de ventas. product_name guarda el nombre tal como se vendió.
  product_id     uuid references public.products(id) on delete set null,
  product_name   text not null,
  quantity       numeric(12,3) not null check (quantity > 0),
  sale_price     numeric(14,2) not null check (sale_price >= 0),
  discount_type  public.sale_discount_type,
  discount_value numeric(14,2) not null default 0 check (discount_value >= 0),
  -- Misma fórmula que usa la pantalla de ventas: el descuento por monto nunca
  -- puede pasarse del subtotal de la línea.
  line_total     numeric(14,2) generated always as (
    round(
      (quantity * sale_price) - case
        when discount_type = 'pct' then (quantity * sale_price) * (discount_value / 100)
        when discount_type = 'amount' then
          case when discount_value > quantity * sale_price
               then quantity * sale_price
               else discount_value end
        else 0
      end
    , 2)
  ) stored,
  created_at     timestamptz not null default now()
);

create index if not exists sale_items_sale_id_idx on public.sale_items (sale_id);
create index if not exists sale_items_product_id_idx on public.sale_items (product_id);

-- ============================================================== PEDIDOS =====
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_date        timestamptz not null default now(),
  supplier          text not null check (length(btrim(supplier)) > 0),
  expected_delivery date,
  notes             text not null default '',
  total_amount      numeric(14,2) not null default 0 check (total_amount >= 0),
  status            public.order_status not null default 'pendiente',
  attachment        text,
  received_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists orders_order_date_idx on public.orders (order_date desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_supplier_idx on public.orders (supplier);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity     numeric(12,3) not null check (quantity > 0),
  unit_cost    numeric(14,2) not null default 0 check (unit_cost >= 0),
  line_total   numeric(14,2) generated always as (round(quantity * unit_cost, 2)) stored,
  created_at   timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_product_id_idx on public.order_items (product_id);

-- =============================================================== GASTOS =====
create table if not exists public.expenses (
  id         uuid primary key default gen_random_uuid(),
  date       date not null,
  kind       public.expense_kind not null default 'gasto',
  amount     numeric(14,2) not null check (amount >= 0),
  concept    text not null default '',
  notes      text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_date_idx on public.expenses (date desc);
create index if not exists expenses_kind_idx on public.expenses (kind);

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

-- ======================================================== CIERRE DIARIO =====
create table if not exists public.daily_closes (
  id              uuid primary key default gen_random_uuid(),
  date            date not null unique,
  sales_total     numeric(14,2) not null default 0 check (sales_total >= 0),
  gain            numeric(14,2) not null default 0,
  expenses_total  numeric(14,2) not null default 0 check (expenses_total >= 0),
  purchases_total numeric(14,2) not null default 0 check (purchases_total >= 0),
  cash_in         numeric(14,2),   -- null = ese día no se anotó nada
  cash_out        numeric(14,2),
  source          public.daily_close_source not null default 'app',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists daily_closes_date_idx on public.daily_closes (date desc);
create index if not exists daily_closes_source_idx on public.daily_closes (source);

drop trigger if exists daily_closes_set_updated_at on public.daily_closes;
create trigger daily_closes_set_updated_at
  before update on public.daily_closes
  for each row execute function public.set_updated_at();

-- ============================================================== VISTAS ======

-- Ventas registradas en la app, agrupadas por día.
create or replace view public.v_sales_daily as
select
  (s.sale_date at time zone 'America/Bogota')::date as date,
  count(*)                          as sales_count,
  coalesce(sum(s.total_amount), 0)  as sales_total,
  coalesce(sum(s.gain), 0)          as gain
from public.sales s
where not s.voided
group by 1;

-- Histórico del Excel agrupado por mes.
create or replace view public.v_monthly_summary as
select
  to_char(date_trunc('month', dc.date), 'YYYY-MM') as month,
  count(*)                             as days,
  coalesce(sum(dc.sales_total), 0)     as sales_total,
  coalesce(sum(dc.gain), 0)            as gain,
  coalesce(sum(dc.expenses_total), 0)  as expenses_total,
  coalesce(sum(dc.purchases_total), 0) as purchases_total
from public.daily_closes dc
group by 1;

-- Categorías con su conteo, para los filtros del catálogo.
create or replace view public.v_product_categories as
select
  p.category,
  count(*)                                   as product_count,
  coalesce(sum(p.stock), 0)                  as stock_units,
  coalesce(sum(p.stock * p.cost_price), 0)   as stock_value_cost
from public.products p
group by 1;

-- =========================================================== FUNCIONES ======
-- Todo lo que toca dos tablas a la vez vive aquí: supabase-js no puede abrir
-- una transacción desde el cliente, así que la venta + sus líneas + el
-- descuento de stock tienen que pasar o fallar juntos dentro de una función.

-- Registra una venta completa. Devuelve la fila de sales ya con los totales.
-- p_sale : { sale_date, payment_method, client_name, voided }
-- p_items: [ { product_id, product, quantity, sale_price, discount_type, discount_value } ]
-- El total y la ganancia NO se toman del cliente: se calculan aquí a partir de
-- las líneas y del cost_price del catálogo.
create or replace function public.create_sale(
  p_sale         jsonb,
  p_items        jsonb,
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

  insert into public.sales (sale_date, payment_method, client_name, voided)
  values (
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
  left join public.products p on p.id = nullif(it->>'product_id', '')::uuid;

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
    where p.id = agg.product_id;
  end if;

  return v_sale;
end;
$$;

-- Anula una venta y devuelve la mercancía al inventario.
-- Se prefiere anular antes que borrar: la venta anulada queda en el historial.
create or replace function public.void_sale(
  p_sale_id       uuid,
  p_restore_stock boolean default true
)
returns public.sales
language plpgsql
as $$
declare
  v_sale public.sales;
begin
  select * into v_sale from public.sales where id = p_sale_id;
  if not found then
    raise exception 'Venta no encontrada' using errcode = 'P0002';
  end if;
  if v_sale.voided then
    return v_sale;  -- ya estaba anulada: no se devuelve el stock dos veces
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
    where p.id = agg.product_id;
  end if;

  update public.sales
  set voided = true, voided_at = now()
  where id = p_sale_id
  returning * into v_sale;

  return v_sale;
end;
$$;

-- Crea un pedido a proveedor con sus líneas. No toca el stock: eso pasa al
-- recibir (receive_order).
-- p_order: { order_date, supplier, expected_delivery, notes, status, attachment }
-- p_items: [ { product_id, product, quantity, unit_cost } ]
create or replace function public.create_order(
  p_order jsonb,
  p_items jsonb
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

  insert into public.orders (order_date, supplier, expected_delivery, notes, status, attachment)
  values (
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
  left join public.products p on p.id = nullif(it->>'product_id', '')::uuid;

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

-- Marca el pedido como recibido y suma la mercancía al inventario.
-- p_update_cost: si se pasa en true, además pisa el cost_price del catálogo con
-- el costo del pedido y lo deja marcado como costo real (cost_is_estimated =
-- false). Va apagado por defecto porque cambia datos del negocio.
create or replace function public.receive_order(
  p_order_id     uuid,
  p_adjust_stock boolean default true,
  p_update_cost  boolean default false
)
returns public.orders
language plpgsql
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id;
  if not found then
    raise exception 'Pedido no encontrado' using errcode = 'P0002';
  end if;
  if v_order.status = 'recibido' then
    return v_order;  -- idempotente: no se suma el stock dos veces
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
    where p.id = agg.product_id;
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
    where p.id = agg.product_id;
  end if;

  update public.orders
  set status = 'recibido', received_at = now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

-- Cancela un pedido. Si ya estaba recibido, descuenta lo que había sumado.
create or replace function public.cancel_order(
  p_order_id     uuid,
  p_adjust_stock boolean default true
)
returns public.orders
language plpgsql
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id;
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
    where p.id = agg.product_id;
  end if;

  update public.orders
  set status = 'cancelado', received_at = null
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

-- Todos los indicadores del tablero en una sola llamada.
-- Las ventas del Excel (daily_closes) y las de la app (sales) van separadas a
-- propósito: sumarlas sería contar el mismo dinero dos veces si algún día
-- llegara a tener las dos cosas.
create or replace function public.get_summary(
  p_from date default null,
  p_to   date default null
)
returns jsonb
language sql
stable
as $$
with rango as (
  select
    coalesce(p_from, (select min(dc.date) from public.daily_closes dc), current_date - 29) as f,
    coalesce(p_to, greatest(current_date, (select max(dc.date) from public.daily_closes dc))) as t
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
    where dc.date between r.f and r.t
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
      and (s.sale_date at time zone 'America/Bogota')::date between r.f and r.t
  ),

  'sales_by_payment_method', (
    select coalesce(jsonb_object_agg(x.payment_method, x.total), '{}'::jsonb)
    from (
      select s.payment_method::text as payment_method, coalesce(sum(s.total_amount), 0) as total
      from public.sales s, rango r
      where not s.voided
        and (s.sale_date at time zone 'America/Bogota')::date between r.f and r.t
      group by 1
    ) x
  ),

  'expenses', (
    select coalesce(jsonb_object_agg(x.kind, x.total), '{}'::jsonb)
    from (
      select e.kind::text as kind, coalesce(sum(e.amount), 0) as total
      from public.expenses e, rango r
      where e.date between r.f and r.t
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
    where (o.order_date at time zone 'America/Bogota')::date between r.f and r.t
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
  ),

  'monthly', (
    select coalesce(jsonb_agg(to_jsonb(m) order by m.month), '[]'::jsonb)
    from public.v_monthly_summary m, rango r
    where m.month between to_char(r.f, 'YYYY-MM') and to_char(r.t, 'YYYY-MM')
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
        and (s.sale_date at time zone 'America/Bogota')::date between r.f and r.t
      group by si.product_id, si.product_name
      order by 3 desc
      limit 5
    ) x
  )
);
$$;

-- ================================================================= RLS ======
-- RLS activo y SIN políticas: nadie con la anon key (o sea, nadie desde el
-- navegador) puede leer ni escribir estas tablas. Todo pasa por las rutas de
-- /api, que se conectan con la service_role key desde el servidor y saltan RLS.
--
-- Si en algún momento se quiere consultar Supabase directo desde el navegador,
-- correr supabase/sql/05_policies_dev.sql. Leer antes las advertencias.
alter table public.products     enable row level security;
alter table public.sales        enable row level security;
alter table public.sale_items   enable row level security;
alter table public.orders       enable row level security;
alter table public.order_items  enable row level security;
alter table public.expenses     enable row level security;
alter table public.daily_closes enable row level security;
