-- Encargados del proyecto (varios nombres por card)
-- Ejecutar en Supabase → SQL Editor → Run

alter table public.gerencia_items
  add column if not exists encargados jsonb not null default '[]'::jsonb;

-- Rellena desde responsable_nombre si había uno solo
update public.gerencia_items
set encargados = jsonb_build_array(responsable_nombre)
where (encargados is null or encargados = '[]'::jsonb)
  and responsable_nombre is not null
  and trim(responsable_nombre) <> '';

select 'Columna encargados (Gerencia) lista.' as resultado;
