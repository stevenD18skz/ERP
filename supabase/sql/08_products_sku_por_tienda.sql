-- =============================================================================
-- Boxes · El SKU es de cada tienda, y deja de ser obligatorio
-- =============================================================================
-- Ejecutar después de 07_tiendas_notnull.sql. Es idempotente.
--
-- QUÉ ARREGLA
-- 01_schema.sql declaró `sku text not null unique`: una restricción global a
-- toda la base, de cuando existía una sola tienda. Al agregar multi-tienda,
-- 06_tiendas.sql corrigió el mismo problema en daily_closes (date -> tienda_id,
-- date) pero se le pasó products.sku. Resultado: crear "ARZ-001" en una tienda
-- le impedía a CUALQUIER otra tienda usar ese código, y el error decía "Ya hay
-- un producto con ese SKU" señalando un producto que quien registra no puede
-- ver ni tocar. Era una fuga de aislamiento entre tiendas.
--
-- POR QUÉ EL SKU PASA A SER OPCIONAL
-- En una tienda de barrio nadie pide "el ARZ-001": se busca por nombre y se
-- cobra por código de barras. Exigirlo obliga a inventar códigos en serie que
-- no significan nada. Se conserva el campo porque sí hace falta para lo que no
-- trae código de barras (granel, reempaque, hecho en casa) y para que el
-- importador de CSV pueda reconocer una fila ya cargada, pero se deja vacío
-- cuando no aporta.
--
-- La unicidad se mantiene solo para los SKU que sí se escriben: dos productos
-- con el mismo código dejarían al importador sin saber cuál actualizar. Los
-- vacíos quedan fuera del índice, así que pueden repetirse sin límite.
-- =============================================================================

-- Se compara sin mayúsculas ni espacios de sobra, igual que el nombre de la
-- tienda en tiendas_nombre_lower_idx: quien escribe "arz-001" un martes y
-- "ARZ-001" el jueves está nombrando la misma cosa.
alter table public.products drop constraint if exists products_sku_key;
alter table public.products alter column sku set default '';

drop index if exists public.products_tienda_sku_idx;
create unique index products_tienda_sku_idx
  on public.products (tienda_id, lower(btrim(sku)))
  where btrim(coalesce(sku, '')) <> '';
