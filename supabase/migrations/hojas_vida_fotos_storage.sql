-- Fotos en hojas de vida: bucket Storage + permisos de escritura para operadores
-- Ejecutar en Supabase → SQL Editor si no se pueden guardar fotos de máquinas.

-- Buckets (públicos para mostrar imágenes en el portal)
insert into storage.buckets (id, name, public)
values
  ('adjuntos-preventivo', 'adjuntos-preventivo', true),
  ('pdfs-nc', 'pdfs-nc', true)
on conflict (id) do update set public = excluded.public;

-- Storage: lectura autenticados, subida admin/operador
drop policy if exists "leer archivos epi" on storage.objects;
drop policy if exists "subir archivos epi" on storage.objects;
drop policy if exists "actualizar archivos epi" on storage.objects;
drop policy if exists "borrar archivos epi" on storage.objects;
drop policy if exists "auth leer archivos epi" on storage.objects;
drop policy if exists "auth subir archivos epi" on storage.objects;
drop policy if exists "auth actualizar archivos epi" on storage.objects;
drop policy if exists "auth borrar archivos epi" on storage.objects;

create policy "auth leer archivos epi" on storage.objects
  for select using (
    bucket_id in ('adjuntos-preventivo', 'pdfs-nc')
    and public.usuario_autenticado()
  );

create policy "auth subir archivos epi" on storage.objects
  for insert with check (
    bucket_id in ('adjuntos-preventivo', 'pdfs-nc')
    and public.usuario_puede_escribir()
  );

create policy "auth actualizar archivos epi" on storage.objects
  for update using (
    bucket_id in ('adjuntos-preventivo', 'pdfs-nc')
    and public.usuario_puede_escribir()
  )
  with check (
    bucket_id in ('adjuntos-preventivo', 'pdfs-nc')
    and public.usuario_puede_escribir()
  );

create policy "auth borrar archivos epi" on storage.objects
  for delete using (
    bucket_id in ('adjuntos-preventivo', 'pdfs-nc')
    and public.usuario_es_admin()
  );

-- hojas_vida: operadores pueden registrar y editar (incluye foto_url); solo admin elimina
drop policy if exists "acceso temporal" on hojas_vida;
drop policy if exists "auth admin hojas_vida" on hojas_vida;
drop policy if exists "auth insert hojas_vida" on hojas_vida;
drop policy if exists "auth update hojas_vida" on hojas_vida;
drop policy if exists "auth delete hojas_vida" on hojas_vida;

create policy "auth insert hojas_vida" on hojas_vida
  for insert with check (public.usuario_puede_escribir());

create policy "auth update hojas_vida" on hojas_vida
  for update using (public.usuario_puede_escribir())
  with check (public.usuario_puede_escribir());

create policy "auth delete hojas_vida" on hojas_vida
  for delete using (public.usuario_es_admin());

select 'Fotos de hojas de vida habilitadas (bucket + permisos operador).' as resultado;
