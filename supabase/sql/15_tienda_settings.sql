-- =============================================================================
-- Boxes · Configuración por tienda
-- =============================================================================
-- Ejecutar después de 14_product_photos_bucket.sql. Es idempotente.
--
-- Un solo jsonb para todos los ajustes en vez de una columna por opción: la
-- idea es que la página de Configuración vaya creciendo (empieza con el
-- ahorro de batería del escáner del celular) sin que cada opción nueva pida
-- otra migración. La forma de lo que va adentro vive en src/lib/settings.ts,
-- que sabe rellenar lo que falte con sus valores por defecto.
-- =============================================================================

alter table public.tiendas
  add column if not exists settings jsonb not null default '{}'::jsonb;
