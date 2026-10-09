-- Reporte de producción Tejidos (TJ-RE-004). Lo usan el líder y el personal del área.

create table if not exists public.reportes_produccion_tejidos (
  id uuid primary key default gen_random_uuid(),
  creado_en timestamptz not null default now(),
  fecha date not null,
  area_trabajo text not null,
  datos jsonb not null default '{}'::jsonb
);

alter table public.reportes_produccion_tejidos enable row level security;

drop policy if exists "tejidos reportes produccion" on public.reportes_produccion_tejidos;
create policy "tejidos reportes produccion"
  on public.reportes_produccion_tejidos
  for all
  using (
    public.usuario_rol() = 'admin'
    or public.usuario_area() = 'Tejidos'
  )
  with check (
    public.usuario_rol() = 'admin'
    or public.usuario_area() = 'Tejidos'
  );

grant select, insert, update, delete on public.reportes_produccion_tejidos to authenticated;
