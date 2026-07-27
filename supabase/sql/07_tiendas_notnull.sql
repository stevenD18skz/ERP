-- =============================================================================
-- Multi-tienda · paso 2: exigir tienda_id
-- =============================================================================
-- Correr DESPUÉS de scripts/seed-tiendas.mjs (que crea las tiendas y hace el
-- backfill de los datos existentes). Antes de eso, esto falla a propósito: es
-- la señal de que faltó correr el backfill.
-- =============================================================================

alter table public.products     alter column tienda_id set not null;
alter table public.sales        alter column tienda_id set not null;
alter table public.orders       alter column tienda_id set not null;
alter table public.expenses     alter column tienda_id set not null;
alter table public.daily_closes alter column tienda_id set not null;
