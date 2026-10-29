create table if not exists caracterizacion_portal (
  id text primary key,
  datos jsonb not null default '{}',
  actualizado_en timestamptz not null default now()
);

alter table caracterizacion_portal enable row level security;

drop policy if exists "acceso temporal caracterizacion_portal" on caracterizacion_portal;
create policy "acceso temporal caracterizacion_portal" on caracterizacion_portal
  for all using (true) with check (true);
