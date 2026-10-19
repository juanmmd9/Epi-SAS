create table if not exists public.compras_mantenimiento (
  id uuid primary key default gen_random_uuid(),
  fecha date,
  descripcion text not null,
  cantidad text not null default '',
  area text not null default '',
  necesidad text not null default '',
  estado text not null default '',
  situacion text not null check (situacion in ('cumplido', 'pendiente', 'cancelado')),
  observacion text not null default '',
  origen text not null default 'compras-admin',
  ingresado boolean not null default false,
  clave text
);

create index if not exists compras_mantenimiento_fecha_idx
  on public.compras_mantenimiento (fecha desc);

create table if not exists public.inventario_movimientos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventario_mantenimiento (id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'salida')),
  cantidad numeric not null check (cantidad > 0),
  creado_en timestamptz not null default now()
);

alter table public.compras_mantenimiento enable row level security;
alter table public.inventario_movimientos enable row level security;

drop policy if exists "acceso temporal compras_mantenimiento" on public.compras_mantenimiento;
create policy "acceso temporal compras_mantenimiento" on public.compras_mantenimiento
  for all using (true) with check (true);

drop policy if exists "acceso temporal inventario_movimientos" on public.inventario_movimientos;
create policy "acceso temporal inventario_movimientos" on public.inventario_movimientos
  for all using (true) with check (true);
