-- Matriz de conocimientos y habilidades (Mantenimiento Mecánico)
-- Ejecutar en Supabase SQL Editor si aún no existe.

create table if not exists public.competencias_matriz (
  id uuid primary key default gen_random_uuid(),
  hoja text not null default 'MECANICO',
  orden integer not null,
  numero integer,
  categoria text not null,
  descripcion text not null,
  meta_d integer not null default 2 check (meta_d >= 0 and meta_d <= 4),
  experto text,
  herramienta text,
  estado_capacitacion text,
  activa boolean not null default true,
  unique (hoja, orden)
);

create table if not exists public.matriz_conocimiento (
  id uuid primary key default gen_random_uuid(),
  personal_id uuid not null references public.personal (id) on delete cascade,
  competencia_id uuid not null references public.competencias_matriz (id) on delete cascade,
  nivel_i integer not null default 1 check (nivel_i >= 0 and nivel_i <= 4),
  nivel_d integer not null default 2 check (nivel_d >= 0 and nivel_d <= 4),
  nivel_h integer not null default 0 check (nivel_h >= 0 and nivel_h <= 4),
  actualizado_en timestamptz not null default now(),
  unique (personal_id, competencia_id)
);

alter table public.competencias_matriz enable row level security;
alter table public.matriz_conocimiento enable row level security;

drop policy if exists "acceso temporal competencias_matriz" on public.competencias_matriz;
create policy "acceso temporal competencias_matriz" on public.competencias_matriz
  for all using (true) with check (true);

drop policy if exists "acceso temporal matriz_conocimiento" on public.matriz_conocimiento;
create policy "acceso temporal matriz_conocimiento" on public.matriz_conocimiento
  for all using (true) with check (true);
