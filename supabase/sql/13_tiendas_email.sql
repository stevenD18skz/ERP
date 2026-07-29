-- =============================================================================
-- Boxes · Login por correo
-- =============================================================================
-- Ejecutar después de 09_categorias_y_marcas.sql. Es idempotente.
--
-- Agrega el correo a tiendas y lo deja obligatorio y único: el login pasa a
-- hacerse con él en vez del nombre de la tienda (que se conserva tal cual,
-- solo como dato de negocio que se sigue mostrando en el topbar).
--
-- El backfill de las dos tiendas que ya existían (ver scripts/seed-tiendas.mjs)
-- va con el correo real que se pidió directamente: no se inventa.
-- =============================================================================

alter table public.tiendas add column if not exists email text;

update public.tiendas set email = 'brayanss2018@gmail.com'
  where lower(nombre) = lower('The Sunny Go') and email is null;
update public.tiendas set email = 'jing253436@gmail.com'
  where lower(nombre) = lower('Jose''s Market') and email is null;

alter table public.tiendas drop constraint if exists tiendas_email_format_check;
alter table public.tiendas add constraint tiendas_email_format_check
  check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

-- Falla a propósito si queda alguna tienda sin correo: mejor enterarse acá que
-- dejar a alguien sin poder iniciar sesión en silencio.
alter table public.tiendas alter column email set not null;

create unique index if not exists tiendas_email_lower_idx
  on public.tiendas (lower(email));
