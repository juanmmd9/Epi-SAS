-- Galería visual de acciones de mejora (panel en Indicadores)
create table if not exists mejoras_portfolio (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  area text,
  fecha date not null default current_date,
  datos jsonb not null default '{}',
  creado_en timestamptz not null default now()
);

alter table mejoras_portfolio enable row level security;

drop policy if exists "acceso temporal mejoras_portfolio" on mejoras_portfolio;
drop policy if exists "auth leer mejoras_portfolio" on mejoras_portfolio;
drop policy if exists "auth admin mejoras_portfolio" on mejoras_portfolio;

create policy "auth leer mejoras_portfolio" on mejoras_portfolio
  for select using (public.usuario_autenticado());

create policy "auth admin mejoras_portfolio" on mejoras_portfolio
  for all using (public.usuario_es_admin())
  with check (public.usuario_es_admin());
