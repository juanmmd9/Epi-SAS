create table if not exists matriz_riesgos_portal (
  id text primary key,
  datos jsonb not null default '{}',
  actualizado_en timestamptz not null default now()
);

alter table matriz_riesgos_portal enable row level security;

drop policy if exists "acceso temporal matriz_riesgos_portal" on matriz_riesgos_portal;
create policy "acceso temporal matriz_riesgos_portal" on matriz_riesgos_portal
  for all using (true) with check (true);
