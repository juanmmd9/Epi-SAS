export const SQL_MIGRACION_COMPUTADORES = `-- Módulo Computadores (inventario IT + PM + piezas)
create table if not exists computadores (
  id uuid primary key default gen_random_uuid(),
  codigo text not null default '',
  ubicacion text not null,
  tipo text not null default 'escritorio'
    check (tipo in ('escritorio', 'portatil', 'otro')),
  usuario_asignado text not null default '',
  frecuencia_pm_meses integer not null default 6 check (frecuencia_pm_meses > 0),
  ultimo_pm date,
  proximo_pm date,
  activa boolean not null default true,
  datos jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists idx_computadores_ubicacion on computadores (ubicacion);
create index if not exists idx_computadores_tipo on computadores (tipo);
create index if not exists idx_computadores_activa on computadores (activa);
create index if not exists idx_computadores_proximo_pm on computadores (proximo_pm);

create table if not exists computadores_pm (
  id uuid primary key default gen_random_uuid(),
  computador_id uuid not null references computadores (id) on delete cascade,
  fecha date not null,
  tecnico text not null default '',
  actividades text not null default '',
  observaciones text not null default '',
  creado_en timestamptz not null default now()
);

create index if not exists idx_computadores_pm_pc on computadores_pm (computador_id);
create index if not exists idx_computadores_pm_fecha on computadores_pm (fecha desc);

create table if not exists computadores_piezas (
  id uuid primary key default gen_random_uuid(),
  computador_id uuid not null references computadores (id) on delete cascade,
  fecha date not null,
  tipo_pieza text not null,
  detalle text not null default '',
  serial text not null default '',
  motivo text not null default 'falla'
    check (motivo in ('falla', 'upgrade', 'preventivo', 'otro')),
  tecnico text not null default '',
  notas text not null default '',
  creado_en timestamptz not null default now()
);

create index if not exists idx_computadores_piezas_pc on computadores_piezas (computador_id);
create index if not exists idx_computadores_piezas_fecha on computadores_piezas (fecha desc);

alter table computadores enable row level security;
alter table computadores_pm enable row level security;
alter table computadores_piezas enable row level security;

drop policy if exists "acceso temporal computadores" on computadores;
create policy "acceso temporal computadores" on computadores
  for all using (true) with check (true);

drop policy if exists "acceso temporal computadores_pm" on computadores_pm;
create policy "acceso temporal computadores_pm" on computadores_pm
  for all using (true) with check (true);

drop policy if exists "acceso temporal computadores_piezas" on computadores_piezas;
create policy "acceso temporal computadores_piezas" on computadores_piezas
  for all using (true) with check (true);
`;

export function esErrorTablaComputadores(mensaje: string): boolean {
  return /computadores|schema cache|does not exist|relation|Could not find the table/i.test(
    mensaje,
  );
}
