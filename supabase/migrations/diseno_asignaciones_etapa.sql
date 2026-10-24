alter table public.diseno_asignaciones
  add column if not exists etapas jsonb not null default '{}'::jsonb;
