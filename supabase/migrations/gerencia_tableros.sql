-- Columnas del tablero Gerencia (ej. Ventas, y las que Gerencia cree)
-- Ejecutar en Supabase → SQL Editor → Run

create table if not exists public.gerencia_tableros (
  id text primary key,
  etiqueta text not null,
  orden integer not null default 100,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

insert into public.gerencia_tableros (id, etiqueta, orden) values
  ('por_clasificar', 'Por clasificar', 10),
  ('lucro_cesante', 'Lucro cesante', 20),
  ('china', 'China proceso', 30),
  ('compras_cali', 'Compras Cali', 40),
  ('impo', 'IMPO', 50),
  ('safety', 'Safety', 60),
  ('gerencia', 'Gerencia', 70),
  ('ventas', 'Ventas', 80)
on conflict (id) do update set
  etiqueta = excluded.etiqueta,
  orden = excluded.orden,
  activo = true;

-- Permitir cualquier id de columna en items (ya no solo la lista fija)
alter table public.gerencia_items drop constraint if exists gerencia_items_tablero_check;

alter table public.gerencia_tableros enable row level security;

drop policy if exists "gerencia_tableros leer" on public.gerencia_tableros;
drop policy if exists "gerencia_tableros escribir" on public.gerencia_tableros;

create policy "gerencia_tableros leer" on public.gerencia_tableros
  for select using (public.usuario_autenticado());

create policy "gerencia_tableros escribir" on public.gerencia_tableros
  for all using (public.usuario_rol() in ('gerencia', 'admin'))
  with check (public.usuario_rol() in ('gerencia', 'admin'));

select 'Columnas de Gerencia (gerencia_tableros) listas.' as resultado;
