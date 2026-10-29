-- Repuestos por área / máquina (módulo Solicitudes)
create table if not exists solicitudes_repuestos (
  id uuid primary key default gen_random_uuid(),
  area text not null,
  hoja_id uuid references hojas_vida (id) on delete set null,
  correctivo_id uuid references correctivo (id) on delete set null,
  codigo text not null default '',
  descripcion text not null,
  cantidad numeric not null default 1 check (cantidad > 0),
  estado text not null default 'solicitado'
    check (estado in ('solicitado', 'pedido', 'recibido', 'instalado', 'cancelado')),
  fecha_necesaria date,
  notas text not null default '',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists idx_repuestos_area on solicitudes_repuestos (area);
create index if not exists idx_repuestos_hoja on solicitudes_repuestos (hoja_id);
create index if not exists idx_repuestos_estado on solicitudes_repuestos (estado);

alter table solicitudes_repuestos enable row level security;

drop policy if exists "acceso temporal repuestos" on solicitudes_repuestos;
create policy "acceso temporal repuestos" on solicitudes_repuestos
  for all using (true) with check (true);
