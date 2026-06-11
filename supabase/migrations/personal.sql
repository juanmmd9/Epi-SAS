-- SOLO ejecuta esto si te falta la tabla personal.
-- No vuelvas a correr schema.sql completo: las demas tablas ya existen.

create table if not exists public.personal (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  cargo text,
  area text,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

alter table public.preventivo
  add column if not exists personal_id uuid references public.personal (id) on delete set null;

alter table public.correctivo
  add column if not exists personal_id uuid references public.personal (id) on delete set null;

alter table public.personal enable row level security;

drop policy if exists "acceso temporal" on public.personal;
drop policy if exists "acceso temporal personal" on public.personal;
create policy "acceso temporal" on public.personal
  for all using (true) with check (true);
