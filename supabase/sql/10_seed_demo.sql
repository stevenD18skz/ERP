-- =============================================================================
-- Boxes · Catálogo y actividad de ejemplo (tienda de demo)
-- =============================================================================
-- Ejecutar después de 01_schema.sql y de `node scripts/seed-tiendas.mjs`
-- (que es quien crea la tienda: el hash de la contraseña se calcula con Node,
-- no con Postgres). Es idempotente.
--
-- Va SOLO a la tienda de demo (nbrayan720@gmail.com), nunca a las tiendas
-- reales: todo el archivo filtra por su correo. No hay datos de 2025 ni de
-- ningún Excel acá — es un catálogo y un puñado de ventas inventados para que
-- alguien pueda entrar, ver la app con contenido y probar el flujo completo
-- sin arriesgar nada real.
--
-- Trae:
--   - 8 categorías y ~30 marcas
--   - 32 productos con precio, costo y stock
--   - Ventas de las últimas 2 semanas (una o dos por día, hasta hoy)
--   - Un puñado de gastos repartidos en el mismo rango
--
-- Las ventas se generan con public.create_sale(), la misma función que usa la
-- app: los totales, la ganancia y el descuento de stock salen calculados de
-- ahí, no a mano. Las fechas son relativas a CURRENT_DATE, así que quedan
-- "recientes" sin importar cuándo se corra este archivo.
-- =============================================================================

do $guard$
begin
  if to_regclass('public.tiendas') is null then
    raise exception 'Falta el esquema. Correr supabase/sql/01_schema.sql primero.';
  end if;
  if not exists (
    select 1 from public.tiendas where lower(email) = lower('nbrayan720@gmail.com')
  ) then
    raise exception 'No existe la tienda de demo en esta base. Correr antes: node scripts/seed-tiendas.mjs';
  end if;
end
$guard$;

-- ========================================================== CATEGORÍAS ======
insert into public.categories (tienda_id, name)
select t.id, c.name
from public.tiendas t
cross join (values
  ('Granos y Abarrotes'),
  ('Aceites'),
  ('Lácteos y Huevos'),
  ('Panadería'),
  ('Bebidas'),
  ('Aseo del Hogar'),
  ('Cuidado Personal'),
  ('Mecato y Dulces')
) as c(name)
where lower(t.email) = lower('nbrayan720@gmail.com')
on conflict do nothing;

-- ============================================================== MARCAS ======
insert into public.brands (tienda_id, name)
select t.id, b.name
from public.tiendas t
cross join (values
  ('Diana'), ('La Muñeca'), ('Zenú'), ('Manuelita'),
  ('Premier'), ('Oliva Real'), ('Riquísimo'), ('Rica'),
  ('Alquería'), ('Kikes'), ('Alpina'),
  ('Bimbo'), ('Doñarepa'), ('Ramo'), ('Festival'),
  ('Coca-Cola'), ('Cristal'), ('Águila'), ('Sello Rojo'),
  ('Fab'), ('Rey'), ('Familia'), ('Límpido'),
  ('Savital'), ('Protex'), ('Colgate'), ('Rexona'),
  ('Margarita'), ('Colombina'), ('Jet'), ('Moto')
) as b(name)
where lower(t.email) = lower('nbrayan720@gmail.com')
on conflict do nothing;

-- =========================================================== PRODUCTOS ======
insert into public.products (tienda_id, name, sku, price, cost_price, stock, category_id, brand_id)
select t.id, v.name, v.sku, v.price, v.cost, v.stock, c.id, br.id
from public.tiendas t
cross join (values
  ('Arroz Diana 500g',            'GRA-001', 'Granos y Abarrotes', 'Diana',       2800,  2150, 40),
  ('Fríjol Cargamanto 500g',      'GRA-002', 'Granos y Abarrotes', 'La Muñeca',   6200,  4800, 15),
  ('Lenteja 500g',                'GRA-003', 'Granos y Abarrotes', 'Zenú',        4300,  3300, 18),
  ('Azúcar Manuelita 1kg',        'GRA-004', 'Granos y Abarrotes', 'Manuelita',   4900,  3900, 25),
  ('Aceite Girasol 1000ml',       'ACE-001', 'Aceites',            'Premier',    12900,  9800, 12),
  ('Aceite Oliva 500ml',          'ACE-002', 'Aceites',            'Oliva Real', 18500, 14200,  6),
  ('Aceite Palma 500ml',          'ACE-003', 'Aceites',            'Riquísimo',   6800,  5100, 20),
  ('Margarina Rica 250g',         'ACE-004', 'Aceites',            'Rica',        4200,  3200, 14),
  ('Leche Entera 1L',             'LAC-001', 'Lácteos y Huevos',   'Alquería',    4300,  3500, 30),
  ('Huevos AA x30',               'LAC-002', 'Lácteos y Huevos',   'Kikes',      18900, 15400,  8),
  ('Queso Campesino 500g',        'LAC-003', 'Lácteos y Huevos',   null,         14200, 11400,  6),
  ('Yogurt Griego 200g',          'LAC-004', 'Lácteos y Huevos',   'Alpina',      3600,  2700, 16),
  ('Pan Tajado',                  'PAN-001', 'Panadería',          'Bimbo',       6800,  5400, 10),
  ('Arepas x5',                   'PAN-002', 'Panadería',          'Doñarepa',    4600,  3600, 12),
  ('Ponqué 300g',                 'PAN-003', 'Panadería',          'Ramo',        5500,  4200,  9),
  ('Galletas x12',                'PAN-004', 'Panadería',          'Festival',    4800,  3700, 14),
  ('Coca-Cola 1.5L',              'BEB-001', 'Bebidas',            'Coca-Cola',   5600,  4400, 22),
  ('Agua 600ml',                  'BEB-002', 'Bebidas',            'Cristal',     2000,  1400, 50),
  ('Cerveza 330ml',                'BEB-003', 'Bebidas',            'Águila',      3500,  2700, 60),
  ('Café 250g',                   'BEB-004', 'Bebidas',            'Sello Rojo',  9900,  7900, 15),
  ('Detergente 900g',             'ASE-001', 'Aseo del Hogar',     'Fab',        11400,  9100, 10),
  ('Jabón de Ropa x3',            'ASE-002', 'Aseo del Hogar',     'Rey',         4200,  3200, 20),
  ('Papel Higiénico x4',          'ASE-003', 'Aseo del Hogar',     'Familia',     9800,  7600, 14),
  ('Límpido 1L',                  'ASE-004', 'Aseo del Hogar',     'Límpido',     5200,  4000, 12),
  ('Shampoo 550ml',               'CUI-001', 'Cuidado Personal',   'Savital',    16900, 13200,  6),
  ('Jabón de Baño x3',            'CUI-002', 'Cuidado Personal',   'Protex',      8500,  6600, 10),
  ('Crema Dental 90g',            'CUI-003', 'Cuidado Personal',   'Colgate',     5900,  4500, 15),
  ('Desodorante',                 'CUI-004', 'Cuidado Personal',   'Rexona',      9200,  7100,  8),
  ('Papas 105g',                  'MEC-001', 'Mecato y Dulces',    'Margarita',   5400,  4200, 20),
  ('Bon Bon Bum x10',             'MEC-002', 'Mecato y Dulces',    'Colombina',   3800,  2900, 25),
  ('Chocolatina',                 'MEC-003', 'Mecato y Dulces',    'Jet',         1500,  1100, 40),
  ('Maní x10',                    'MEC-004', 'Mecato y Dulces',    'Moto',        4600,  3500, 18)
) as v(name, sku, category, brand, price, cost, stock)
left join public.categories c  on c.tienda_id = t.id and c.name = v.category
left join public.brands     br on br.tienda_id = t.id and br.name = v.brand
where lower(t.email) = lower('nbrayan720@gmail.com')
on conflict do nothing;

-- ============================================ VENTAS Y GASTOS DE EJEMPLO ====
do $demo$
declare
  v_tienda_id   uuid;
  v_product_ids uuid[];
  v_methods     public.payment_method[] := array['efectivo','efectivo','tarjeta','transferencia']::public.payment_method[];
  d             int;
  ventas_del_dia int;
  i             int;
  v_num_items   int;
  v_items       jsonb;
begin
  select id into v_tienda_id from public.tiendas where lower(email) = lower('nbrayan720@gmail.com');

  -- Ya corrido antes: no se piensa duplicar ventas cada vez que se vuelve a
  -- correr el archivo.
  if exists (select 1 from public.sales where tienda_id = v_tienda_id) then
    raise notice 'La tienda de demo ya tiene ventas; no se generan más.';
    return;
  end if;

  select array_agg(id) into v_product_ids from public.products where tienda_id = v_tienda_id;
  if v_product_ids is null or array_length(v_product_ids, 1) < 10 then
    raise exception 'Faltan productos de demo: revisar la sección de arriba de este mismo archivo.';
  end if;

  -- Dos semanas hasta hoy, una o dos ventas por día.
  for d in reverse 13..0 loop
    ventas_del_dia := 1 + floor(random() * 2)::int;
    for i in 1..ventas_del_dia loop
      v_num_items := 1 + floor(random() * 2)::int;

      select jsonb_agg(jsonb_build_object(
               'product_id', v_product_ids[1 + floor(random() * array_length(v_product_ids, 1))::int],
               'quantity',   1 + floor(random() * 3)::int
             ))
        into v_items
      from generate_series(1, v_num_items);

      perform public.create_sale(
        jsonb_build_object(
          'sale_date', (current_date - d)::timestamptz
            + make_interval(hours => 8 + floor(random() * 11)::int, mins => floor(random() * 60)::int),
          'payment_method', v_methods[1 + floor(random() * array_length(v_methods, 1))::int]
        ),
        v_items,
        v_tienda_id
      );
    end loop;
  end loop;

  -- Un puñado de gastos repartidos en el mismo rango, sin llegar a los 522
  -- del histórico viejo: es una demo, no una contabilidad completa.
  insert into public.expenses (tienda_id, date, kind, amount, concept)
  select v_tienda_id, x.date, x.kind::public.expense_kind, x.amount, x.concept
  from (values
    (current_date - 12, 'gasto',   45000, 'Domicilio de mercado'),
    (current_date - 10, 'gasto',   25000, 'Bolsas y empaques'),
    (current_date -  9, 'entrada', 200000, 'Abono del dueño a caja'),
    (current_date -  7, 'gasto',   60000, 'Transporte de mercancía'),
    (current_date -  5, 'gasto',   18000, 'Aseo del local'),
    (current_date -  3, 'salida',  50000, 'Retiro para gastos personales'),
    (current_date -  2, 'gasto',   32000, 'Reparación de la nevera'),
    (current_date,      'gasto',   15000, 'Recarga del datáfono')
  ) as x(date, kind, amount, concept);
end
$demo$;
