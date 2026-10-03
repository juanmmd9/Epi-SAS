-- Políticas RLS para mejoras_portfolio (galería en Indicadores)
-- Ejecutar en Supabase → SQL Editor si aparece:
-- "new row violates row-level security policy for table mejoras_portfolio"

create table if not exists mejoras_portfolio (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  area text,
  fecha date not null default current_date,
  datos jsonb not null default '{}',
  creado_en timestamptz not null default now()
);

alter table mejoras_portfolio enable row level security;

-- Quitar políticas anteriores (temporal o incompletas)
drop policy if exists "acceso temporal mejoras_portfolio" on mejoras_portfolio;
drop policy if exists "auth leer mejoras_portfolio" on mejoras_portfolio;
drop policy if exists "auth admin mejoras_portfolio" on mejoras_portfolio;

-- Lectura: cualquier usuario del portal autenticado (consulta ve indicadores)
create policy "auth leer mejoras_portfolio" on mejoras_portfolio
  for select using (public.usuario_autenticado());

-- Escritura: solo administrador (coincide con editar.indicadores en el portal)
create policy "auth admin mejoras_portfolio" on mejoras_portfolio
  for all using (public.usuario_es_admin())
  with check (public.usuario_es_admin());

select 'Políticas RLS de mejoras_portfolio aplicadas.' as resultado;
