create table if not exists public.personal_documentos (
  id uuid primary key default gen_random_uuid(),
  personal_id uuid not null references public.personal (id) on delete cascade,
  tipo text not null,
  nombre text not null,
  url text not null,
  subido_en timestamptz not null default now()
);

create index if not exists personal_documentos_personal_id_idx
  on public.personal_documentos (personal_id);

alter table public.personal_documentos enable row level security;

drop policy if exists "acceso temporal personal_documentos" on public.personal_documentos;
create policy "acceso temporal personal_documentos" on public.personal_documentos
  for all using (true) with check (true);
