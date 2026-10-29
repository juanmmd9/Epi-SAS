-- Asignación de operarios a solicitudes correctivas + auto-asignación por área.
-- Ejecutar en Supabase → SQL Editor → Run

create table if not exists public.correctivo_asignaciones (
  id uuid primary key default gen_random_uuid(),
  correctivo_id uuid not null references public.correctivo (id) on delete cascade,
  area text not null,
  personal_id uuid not null references public.personal (id) on delete cascade,
  asignado_por uuid references auth.users (id) on delete set null,
  origen text not null default 'manual'
    check (origen in ('auto_area', 'manual')),
  creado_en timestamptz not null default now(),
  unique (correctivo_id, personal_id)
);

create index if not exists idx_corr_asign_correctivo
  on public.correctivo_asignaciones (correctivo_id);

create index if not exists idx_corr_asign_personal
  on public.correctivo_asignaciones (personal_id);

create index if not exists idx_corr_asign_area
  on public.correctivo_asignaciones (area);

alter table public.correctivo_asignaciones enable row level security;

drop policy if exists "corr_asign leer" on public.correctivo_asignaciones;
create policy "corr_asign leer" on public.correctivo_asignaciones
  for select to authenticated
  using (public.usuario_autenticado());

drop policy if exists "corr_asign escribir" on public.correctivo_asignaciones;
create policy "corr_asign escribir" on public.correctivo_asignaciones
  for insert to authenticated
  with check (public.usuario_es_admin() or public.usuario_puede_escribir());

drop policy if exists "corr_asign actualizar" on public.correctivo_asignaciones;
create policy "corr_asign actualizar" on public.correctivo_asignaciones
  for update to authenticated
  using (public.usuario_es_admin())
  with check (public.usuario_es_admin());

drop policy if exists "corr_asign borrar" on public.correctivo_asignaciones;
create policy "corr_asign borrar" on public.correctivo_asignaciones
  for delete to authenticated
  using (public.usuario_es_admin() or public.usuario_puede_escribir());

-- Comparación simple de área (minúsculas / sin espacios extremos).
create or replace function public.clave_area_txt(a text)
returns text
language sql
immutable
as $$
  select lower(trim(both from coalesce(a, '')));
$$;

-- Operarios activos con personal_id cuya área de portal o de personal coincide.
create or replace function public.operarios_por_area(p_area text)
returns table (personal_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select distinct u.personal_id
  from public.usuarios_portal u
  left join public.personal p on p.id = u.personal_id
  where u.activo = true
    and u.rol = 'operador'
    and u.personal_id is not null
    and (
      public.clave_area_txt(u.area) = public.clave_area_txt(p_area)
      or public.clave_area_txt(p.area) = public.clave_area_txt(p_area)
    );
$$;

-- Al crear solicitud abierta: asigna a todos los operarios del área.
create or replace function public.trg_auto_asignar_solicitud_area()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fcierre text;
  pid uuid;
begin
  fcierre := coalesce(NEW.datos->>'fechaCierre', '');
  if fcierre <> '' then
    return NEW;
  end if;

  for pid in select o.personal_id from public.operarios_por_area(NEW.area) o
  loop
    insert into public.correctivo_asignaciones (
      correctivo_id, area, personal_id, origen
    )
    values (NEW.id, NEW.area, pid, 'auto_area')
    on conflict (correctivo_id, personal_id) do nothing;
  end loop;

  return NEW;
exception
  when others then
    raise warning 'trg_auto_asignar_solicitud_area: %', SQLERRM;
    return NEW;
end;
$$;

drop trigger if exists trg_auto_asignar_solicitud_area on public.correctivo;

-- Nombre antes de trg_avisar_* para que corra primero (orden alfabético).
create trigger trg_auto_asignar_solicitud_area
  after insert on public.correctivo
  for each row
  execute function public.trg_auto_asignar_solicitud_area();

select 'correctivo_asignaciones + auto-asignación por área lista.' as resultado;

-- Backfill: asignar operarios del área a solicitudes abiertas existentes sin asignación.
insert into public.correctivo_asignaciones (correctivo_id, area, personal_id, origen)
select c.id, c.area, o.personal_id, 'auto_area'
from public.correctivo c
cross join lateral public.operarios_por_area(c.area) o
where coalesce(c.datos->>'fechaCierre', '') = ''
on conflict (correctivo_id, personal_id) do nothing;
