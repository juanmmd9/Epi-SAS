-- =====================================================================
-- APLICAR RLS — usuarios del portal y roles (admin / operador / consulta)
--
-- Copia TODO este archivo en Supabase → SQL Editor → Run (una sola vez).
-- Eso habilita RLS y reemplaza las políticas "acceso temporal" por rol.
--
-- Después:
--   1) Authentication → Users → crear usuario
--   2) Insertar fila en usuarios_portal (ver ejemplo al final)
-- =====================================================================

create table if not exists usuarios_portal (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  nombre text not null default '',
  rol text not null default 'operador'
    check (rol in ('admin', 'operador', 'consulta')),
  personal_id uuid references personal (id) on delete set null,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create index if not exists idx_usuarios_portal_rol on usuarios_portal (rol);
create index if not exists idx_usuarios_portal_personal on usuarios_portal (personal_id);

alter table usuarios_portal enable row level security;

create or replace function public.usuario_rol()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select rol from usuarios_portal where id = auth.uid() and activo = true),
    ''
  );
$$;

create or replace function public.usuario_es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.usuario_rol() = 'admin';
$$;

create or replace function public.usuario_puede_escribir()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.usuario_rol() in ('admin', 'operador');
$$;

create or replace function public.usuario_autenticado()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and public.usuario_rol() <> '';
$$;

drop policy if exists "usuarios leer perfil" on usuarios_portal;
create policy "usuarios leer perfil" on usuarios_portal
  for select using (id = auth.uid() or public.usuario_es_admin());

drop policy if exists "usuarios admin gestiona" on usuarios_portal;
create policy "usuarios admin gestiona" on usuarios_portal
  for all using (public.usuario_es_admin())
  with check (public.usuario_es_admin());

-- Helper: reemplaza política temporal por rol
create or replace function public._aplicar_rls_tabla(nombre text) returns void
language plpgsql
as $$
begin
  execute format('alter table %I enable row level security', nombre);

  execute format('drop policy if exists "acceso temporal" on %I', nombre);
  execute format('drop policy if exists "acceso temporal personal" on %I', nombre);
  execute format('drop policy if exists "acceso temporal competencias_matriz" on %I', nombre);
  execute format('drop policy if exists "acceso temporal matriz_conocimiento" on %I', nombre);
  execute format('drop policy if exists "acceso temporal horario_laboral" on %I', nombre);
  execute format('drop policy if exists "acceso temporal festivos" on %I', nombre);
  execute format('drop policy if exists "acceso temporal permisos_personal" on %I', nombre);
  execute format('drop policy if exists "auth leer %I" on %I', nombre, nombre);
  execute format('drop policy if exists "auth escribir %I" on %I', nombre, nombre);
  execute format('drop policy if exists "auth actualizar %I" on %I', nombre, nombre);
  execute format('drop policy if exists "auth borrar %I" on %I', nombre, nombre);
  execute format('drop policy if exists "auth admin %I" on %I', nombre, nombre);

  execute format(
    'create policy "auth leer %1$s" on %1$I for select using (public.usuario_autenticado())',
    nombre
  );
  execute format(
    'create policy "auth escribir %1$s" on %1$I for insert with check (public.usuario_puede_escribir())',
    nombre
  );
  execute format(
    'create policy "auth actualizar %1$s" on %1$I for update using (public.usuario_puede_escribir()) with check (public.usuario_puede_escribir())',
    nombre
  );
  execute format(
    'create policy "auth borrar %1$s" on %1$I for delete using (public.usuario_es_admin())',
    nombre
  );
end;
$$;

-- Tablas operativas (operador puede crear/editar, admin puede borrar)
-- perform = no aparece "_aplicar_rls_tabla" en la pestaña Results
do $aplicar_rls$
begin
  perform public._aplicar_rls_tabla('preventivo');
  perform public._aplicar_rls_tabla('correctivo');
  perform public._aplicar_rls_tabla('cronograma');
  perform public._aplicar_rls_tabla('cronograma_excepciones');
  perform public._aplicar_rls_tabla('no_conformidades');
  perform public._aplicar_rls_tabla('permisos_personal');
end;
$aplicar_rls$;

-- Tablas maestras (solo admin escribe)
alter table hojas_vida enable row level security;
drop policy if exists "acceso temporal" on hojas_vida;
drop policy if exists "auth leer hojas_vida" on hojas_vida;
drop policy if exists "auth admin hojas_vida" on hojas_vida;
create policy "auth leer hojas_vida" on hojas_vida
  for select using (public.usuario_autenticado());
create policy "auth admin hojas_vida" on hojas_vida
  for all using (public.usuario_es_admin())
  with check (public.usuario_es_admin());

alter table personal enable row level security;
drop policy if exists "acceso temporal" on personal;
drop policy if exists "acceso temporal personal" on personal;
drop policy if exists "auth leer personal" on personal;
drop policy if exists "auth admin personal" on personal;
create policy "auth leer personal" on personal
  for select using (public.usuario_autenticado());
create policy "auth admin personal" on personal
  for all using (public.usuario_es_admin())
  with check (public.usuario_es_admin());

alter table horas_programadas enable row level security;
drop policy if exists "acceso temporal" on horas_programadas;
drop policy if exists "auth leer horas_programadas" on horas_programadas;
drop policy if exists "auth admin horas_programadas" on horas_programadas;
create policy "auth leer horas_programadas" on horas_programadas
  for select using (public.usuario_autenticado());
create policy "auth admin horas_programadas" on horas_programadas
  for all using (public.usuario_es_admin())
  with check (public.usuario_es_admin());

alter table competencias_matriz enable row level security;
drop policy if exists "acceso temporal competencias_matriz" on competencias_matriz;
drop policy if exists "auth leer competencias_matriz" on competencias_matriz;
drop policy if exists "auth admin competencias_matriz" on competencias_matriz;
create policy "auth leer competencias_matriz" on competencias_matriz
  for select using (public.usuario_autenticado());
create policy "auth admin competencias_matriz" on competencias_matriz
  for all using (public.usuario_es_admin())
  with check (public.usuario_es_admin());

alter table horario_laboral enable row level security;
drop policy if exists "acceso temporal horario_laboral" on horario_laboral;
drop policy if exists "auth leer horario_laboral" on horario_laboral;
drop policy if exists "auth admin horario_laboral" on horario_laboral;
create policy "auth leer horario_laboral" on horario_laboral
  for select using (public.usuario_autenticado());
create policy "auth admin horario_laboral" on horario_laboral
  for all using (public.usuario_es_admin())
  with check (public.usuario_es_admin());

alter table festivos enable row level security;
drop policy if exists "acceso temporal festivos" on festivos;
drop policy if exists "auth leer festivos" on festivos;
drop policy if exists "auth admin festivos" on festivos;
create policy "auth leer festivos" on festivos
  for select using (public.usuario_autenticado());
create policy "auth admin festivos" on festivos
  for all using (public.usuario_es_admin())
  with check (public.usuario_es_admin());

-- Matriz: operador puede actualizar solo su fila de personal vinculado
alter table matriz_conocimiento enable row level security;
drop policy if exists "acceso temporal matriz_conocimiento" on matriz_conocimiento;
drop policy if exists "auth leer matriz_conocimiento" on matriz_conocimiento;
drop policy if exists "auth escribir matriz_conocimiento" on matriz_conocimiento;
drop policy if exists "auth actualizar matriz_conocimiento" on matriz_conocimiento;
drop policy if exists "auth borrar matriz_conocimiento" on matriz_conocimiento;
drop policy if exists "auth admin matriz_conocimiento" on matriz_conocimiento;
create policy "auth leer matriz_conocimiento" on matriz_conocimiento
  for select using (public.usuario_autenticado());
create policy "auth escribir matriz_conocimiento" on matriz_conocimiento
  for insert with check (
    public.usuario_es_admin()
    or (
      public.usuario_rol() = 'operador'
      and personal_id = (select personal_id from usuarios_portal where id = auth.uid())
    )
  );
create policy "auth actualizar matriz_conocimiento" on matriz_conocimiento
  for update using (
    public.usuario_es_admin()
    or (
      public.usuario_rol() = 'operador'
      and personal_id = (select personal_id from usuarios_portal where id = auth.uid())
    )
  )
  with check (
    public.usuario_es_admin()
    or (
      public.usuario_rol() = 'operador'
      and personal_id = (select personal_id from usuarios_portal where id = auth.uid())
    )
  );
create policy "auth borrar matriz_conocimiento" on matriz_conocimiento
  for delete using (public.usuario_es_admin());

drop function if exists public._aplicar_rls_tabla(text);

-- Storage: solo usuarios autenticados
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

-- Ejemplo: crear primer administrador (reemplazar UUID y email)
-- insert into usuarios_portal (id, email, nombre, rol)
-- values ('00000000-0000-0000-0000-000000000000', 'admin@epi.com', 'Administrador', 'admin');

select 'RLS aplicado correctamente. Siguiente: crear usuario en Auth e insertar en usuarios_portal.' as resultado;
