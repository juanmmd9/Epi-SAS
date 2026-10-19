create table if not exists public.inventario_mantenimiento (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('herramientas', 'insumos')),
  descripcion text not null,
  cantidad text not null default '',
  unidad text not null default '',
  creado_en timestamptz not null default now()
);

create index if not exists inventario_mantenimiento_tipo_idx
  on public.inventario_mantenimiento (tipo, descripcion);

alter table public.inventario_mantenimiento enable row level security;

drop policy if exists "acceso temporal inventario_mantenimiento" on public.inventario_mantenimiento;
create policy "acceso temporal inventario_mantenimiento" on public.inventario_mantenimiento
  for all using (true) with check (true);
