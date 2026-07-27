-- =============================================================================
-- OPCIONAL · Políticas abiertas para desarrollo
-- =============================================================================
-- NO correr esto si no hace falta.
--
-- El esquema deja RLS activo y sin políticas: las tablas solo se pueden tocar
-- desde el servidor con la service_role key, que es como trabajan las rutas de
-- /api. Ese es el modo seguro y es el que la app usa.
--
-- Este archivo abre lectura y escritura a la anon key, o sea a cualquiera que
-- tenga la URL del proyecto y la clave pública que va en el bundle del
-- navegador. Sirve solo para dos cosas:
--   1. probar consultas rápido desde el navegador mientras se desarrolla;
--   2. que el front funcione sin haber configurado todavía SUPABASE_SERVICE_ROLE_KEY.
--
-- Con esto activo, cualquiera que abra la app puede leer los precios, ver las
-- ventas del negocio y borrar tablas enteras desde la consola del navegador.
-- Antes de publicar la aplicación hay que revertirlo con 05_policies_drop
-- (el bloque comentado del final).
-- =============================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'products', 'sales', 'sale_items', 'orders', 'order_items', 'expenses', 'daily_closes'
  ] loop
    execute format('drop policy if exists dev_all_access on public.%I', t);
    execute format(
      'create policy dev_all_access on public.%I for all to anon, authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

-- Para volver al modo seguro, correr esto:
--
-- do $$
-- declare t text;
-- begin
--   foreach t in array array[
--     'products', 'sales', 'sale_items', 'orders', 'order_items', 'expenses', 'daily_closes'
--   ] loop
--     execute format('drop policy if exists dev_all_access on public.%I', t);
--   end loop;
-- end $$;
