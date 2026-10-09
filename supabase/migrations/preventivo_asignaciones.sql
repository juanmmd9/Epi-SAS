-- Asignación de operarios a citas de mantenimiento preventivo (cronograma)
-- Ejecutar en Supabase → SQL Editor → Run

create table if not exists public.preventivo_asignaciones (
  id uuid primary key default gen_random_uuid(),
  hoja_id uuid not null references public.hojas_vida (id) on delete cascade,
  area text not null,
  fecha_programada date not null,
  personal_id uuid not null references public.personal (id) on delete cascade,
  asignado_por uuid references auth.users (id) on delete set null,
  notas text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  -- Varios operarios pueden compartir la misma cita (máquina + fecha).
  unique (hoja_id, fecha_programada, personal_id)
);

create index if not exists idx_pm_asign_hoja_fecha
  on public.preventivo_asignaciones (hoja_id, fecha_programada);

create index if not exists idx_pm_asign_personal
  on public.preventivo_asignaciones (personal_id);

create index if not exists idx_pm_asign_fecha
  on public.preventivo_asignaciones (fecha_programada);

alter table public.preventivo_asignaciones enable row level security;

drop policy if exists "pm_asign leer" on public.preventivo_asignaciones;
create policy "pm_asign leer" on public.preventivo_asignaciones
  for select to authenticated
  using (public.usuario_autenticado());

drop policy if exists "pm_asign escribir" on public.preventivo_asignaciones;
create policy "pm_asign escribir" on public.preventivo_asignaciones
  for insert to authenticated
  with check (public.usuario_es_admin());

drop policy if exists "pm_asign actualizar" on public.preventivo_asignaciones;
create policy "pm_asign actualizar" on public.preventivo_asignaciones
  for update to authenticated
  using (public.usuario_es_admin())
  with check (public.usuario_es_admin());

drop policy if exists "pm_asign borrar" on public.preventivo_asignaciones;
create policy "pm_asign borrar" on public.preventivo_asignaciones
  for delete to authenticated
  using (public.usuario_es_admin());

select 'Tabla preventivo_asignaciones lista.' as resultado;
