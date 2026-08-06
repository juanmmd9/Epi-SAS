-- Tokens FCM para notificaciones push (app cerrada)
-- Ejecutar en Supabase → SQL Editor → Run

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null,
  plataforma text not null default 'android',
  activo boolean not null default true,
  actualizado_en timestamptz not null default now(),
  creado_en timestamptz not null default now(),
  unique (token)
);

create index if not exists idx_push_tokens_user on public.push_tokens (user_id);
create index if not exists idx_push_tokens_activo on public.push_tokens (activo) where activo = true;

alter table public.push_tokens enable row level security;

drop policy if exists "push_tokens_select_propio" on public.push_tokens;
create policy "push_tokens_select_propio" on public.push_tokens
  for select to authenticated
  using (user_id = auth.uid() or public.usuario_es_admin());

drop policy if exists "push_tokens_upsert_propio" on public.push_tokens;
create policy "push_tokens_upsert_propio" on public.push_tokens
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "push_tokens_update_propio" on public.push_tokens;
create policy "push_tokens_update_propio" on public.push_tokens
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "push_tokens_delete_propio" on public.push_tokens;
create policy "push_tokens_delete_propio" on public.push_tokens
  for delete to authenticated
  using (user_id = auth.uid() or public.usuario_es_admin());

-- Lectura de tokens de mantenimiento para la Edge Function (service role bypassa RLS).
-- Los destinatarios son usuarios con rol admin / operador / consulta activos.

select 'Tabla push_tokens lista.' as resultado;
