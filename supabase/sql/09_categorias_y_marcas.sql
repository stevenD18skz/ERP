-- =============================================================================
-- ERP Supermercado · La categoría deja de ser texto y aparece la marca
-- =============================================================================
-- Ejecutar después de 08_products_sku_por_tienda.sql. Es idempotente.
--
-- QUÉ CAMBIA
-- Hasta ahora la categoría era una columna de texto dentro de cada producto:
-- la palabra "Bebidas" escrita una vez por cada bebida del catálogo. Con eso,
-- "Bebidas", "bebidas" y "Bebida" eran tres categorías distintas, renombrar
-- una obligaba a un update masivo, y una categoría solo existía mientras
-- algún producto la mencionara: al borrar el último producto desaparecía.
--
-- Ahora categoría y marca son tablas propias y el producto apunta a ellas.
-- Una categoría tiene muchos productos y un producto tiene una sola categoría;
-- la marca funciona igual. Las dos son de cada tienda: que el vecino haya
-- creado "Lácteos" no tiene por qué aparecer en este catálogo.
--
-- LAS DOS SON OPCIONALES
-- null es "sin categoría" / "sin marca", que es lo normal en el granel, el
-- reempaque y lo hecho en casa. No se crea una fila "Sin categoría" de mentira
-- para representar la ausencia: la pantalla ya sabe cómo mostrar el vacío.
--
-- LA COLUMNA products.category SE BORRA
-- Primero se crean las categorías a partir de los textos que ya están
-- escritos y se llena category_id; recién entonces se elimina la columna.
-- Dejar las dos sería tener dos verdades: al renombrar una categoría el texto
-- viejo seguiría ahí, mintiendo, y habría que acordarse de cuál manda.
-- El backfill de más abajo existe para las bases que ya tenían el catálogo
-- cargado con el formato viejo. Las semillas se regeneraron para que escriban
-- directamente el formato nuevo, y por eso pasaron a numerarse 10, 11 y 12:
-- van después de este archivo.
--
-- ON DELETE SET NULL en las dos: borrar la categoría "Bebidas" no puede
-- llevarse por delante las bebidas del catálogo. Los productos quedan sin
-- categoría y se les vuelve a poner.
-- =============================================================================

-- ========================================================== CATEGORÍAS ======
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  tienda_id  uuid not null references public.tiendas(id) on delete cascade,
  name       text not null check (length(btrim(name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Se compara sin mayúsculas ni espacios de sobra, igual que el nombre de la
-- tienda y que el SKU: quien escribe "granos" un martes y "Granos" el jueves
-- está nombrando la misma categoría, y el formulario tiene que ofrecerle la
-- que ya existe en vez de crearle una gemela.
create unique index if not exists categories_tienda_name_idx
  on public.categories (tienda_id, lower(btrim(name)));

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ============================================================== MARCAS ======
create table if not exists public.brands (
  id         uuid primary key default gen_random_uuid(),
  tienda_id  uuid not null references public.tiendas(id) on delete cascade,
  name       text not null check (length(btrim(name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists brands_tienda_name_idx
  on public.brands (tienda_id, lower(btrim(name)));

drop trigger if exists brands_set_updated_at on public.brands;
create trigger brands_set_updated_at
  before update on public.brands
  for each row execute function public.set_updated_at();

-- ====================================================== EN EL PRODUCTO ======
alter table public.products
  add column if not exists category_id uuid references public.categories(id) on delete set null;
alter table public.products
  add column if not exists brand_id uuid references public.brands(id) on delete set null;

create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists products_brand_id_idx    on public.products (brand_id);

-- ============================================== MIGRACIÓN DEL TEXTO ========
-- La vista vieja de categorías se arma sobre products.category, así que Postgres
-- no deja borrar la columna mientras la vista exista. Se tumba acá y se vuelve a
-- crear más abajo, ya sobre la tabla nueva.
drop view if exists public.v_product_categories;

-- Todo el bloque va dentro de un if: en la segunda corrida la columna ya no
-- existe y sin esta guarda el archivo fallaría en vez de no hacer nada.
do $migracion$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'products'
      and column_name  = 'category'
  ) then

    -- Una fila por categoría distinta de cada tienda. El distinct on se queda
    -- con una sola escritura cuando el catálogo trae "Bebidas" y "bebidas":
    -- el índice único no admite las dos y on conflict no sabe resolver
    -- duplicados que vengan dentro del mismo insert.
    execute $sql$
      insert into public.categories (tienda_id, name)
      select distinct on (p.tienda_id, lower(btrim(p.category)))
             p.tienda_id,
             btrim(p.category)
      from public.products p
      where p.tienda_id is not null
        and btrim(coalesce(p.category, '')) <> ''
        -- 'Sin categoría' era el relleno por defecto del esquema viejo, no una
        -- categoría que alguien haya decidido: pasa a ser null.
        and lower(btrim(p.category)) <> 'sin categoría'
      order by p.tienda_id, lower(btrim(p.category)), btrim(p.category)
      on conflict do nothing
    $sql$;

    execute $sql$
      update public.products p
      set category_id = c.id
      from public.categories c
      where c.tienda_id = p.tienda_id
        and lower(btrim(c.name)) = lower(btrim(p.category))
        and p.category_id is null
    $sql$;

    -- El índice sobre la columna de texto se va solo con ella.
    execute $sql$ alter table public.products drop column category $sql$;
  end if;
end
$migracion$;

-- =============================================================== VISTAS =====
-- security_invoker = true en las tres: sin eso una vista se consulta con los
-- permisos de quien la creó y se salta el RLS de las tablas de abajo, o sea que
-- cualquiera con la anon key podría leer por la vista lo que la tabla le niega.
-- Con el interruptor puesto, la vista pregunta con los permisos de quien la
-- consulta: la API (service_role) sigue viendo todo y el navegador, nada.
--
-- Los productos con el nombre de su categoría y de su marca ya resueltos.
-- Existe para que la API pueda seguir buscando y ordenando por esos nombres
-- con una sola consulta plana: PostgREST no sabe meter una tabla relacionada
-- dentro de un `or(...)`, así que el join se hace acá. Se lee de la vista y se
-- escribe en la tabla.
drop view if exists public.v_products;
create view public.v_products with (security_invoker = true) as
select
  p.*,
  c.name as category,
  b.name as brand
from public.products p
left join public.categories c on c.id = p.category_id
left join public.brands     b on b.id = p.brand_id;

-- Las categorías de la tienda con su conteo, para los filtros y para el select
-- del formulario. Ahora salen de la tabla y no de los productos: una categoría
-- recién creada aparece aunque todavía no tenga nada adentro, y una que se
-- quedó vacía sigue estando para volver a usarla.
-- (El drop de la versión vieja quedó más arriba, antes de borrar la columna.)
create view public.v_product_categories with (security_invoker = true) as
select
  c.tienda_id,
  c.id                                     as category_id,
  c.name                                   as category,
  count(p.id)                              as product_count,
  coalesce(sum(p.stock), 0)                as stock_units,
  coalesce(sum(p.stock * p.cost_price), 0) as stock_value_cost
from public.categories c
left join public.products p on p.category_id = c.id
group by 1, 2, 3;

drop view if exists public.v_product_brands;
create view public.v_product_brands with (security_invoker = true) as
select
  b.tienda_id,
  b.id                                     as brand_id,
  b.name                                   as brand,
  count(p.id)                              as product_count,
  coalesce(sum(p.stock), 0)                as stock_units,
  coalesce(sum(p.stock * p.cost_price), 0) as stock_value_cost
from public.brands b
left join public.products p on p.brand_id = b.id
group by 1, 2, 3;

-- ================================================================= RLS ======
-- Igual que el resto del esquema: RLS activo y sin políticas, o sea que desde
-- el navegador con la anon key no se puede tocar nada. Todo pasa por /api con
-- la service_role key.
alter table public.categories enable row level security;
alter table public.brands     enable row level security;
