-- Bucket público para las fotos que la propia tienda sube o toma con la
-- cámara del celular al crear un producto (distinto de "photo" cuando viene
-- de un catálogo público, que ya es una URL externa). Público de lectura
-- porque son fotos de producto, no datos sensibles; la escritura solo pasa
-- por /api/products/photo con la service_role, así que no hace falta política
-- de insert/update/delete: RLS de storage.objects no aplica a esa clave.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-photos', 'product-photos', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
