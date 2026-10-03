-- Realtime para tablero Gerencia (actualización automática entre usuarios)
-- Ejecutar en Supabase → SQL Editor → Run

alter table public.gerencia_items replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.gerencia_items;
exception
  when duplicate_object then null;
end $$;

select 'Realtime activado para gerencia_items.' as resultado;

-- También columnas del tablero
alter table public.gerencia_tableros replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.gerencia_tableros;
exception
  when duplicate_object then null;
  when undefined_table then null;
end $$;
