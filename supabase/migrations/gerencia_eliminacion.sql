-- Soft-delete con motivo visible para el área / líder
-- Ejecutar en Supabase → SQL Editor → Run
-- (Después de gerencia_setup_completo.sql o gerencia_items.sql)

alter table public.gerencia_items
  add column if not exists motivo_eliminacion text;
alter table public.gerencia_items
  add column if not exists eliminado_en timestamptz;
alter table public.gerencia_items
  add column if not exists eliminado_por_nombre text;

alter table public.gerencia_items drop constraint if exists gerencia_items_estado_check;
alter table public.gerencia_items
  add constraint gerencia_items_estado_check
  check (estado in ('pendiente', 'en_proceso', 'hecho', 'pausado', 'eliminado'));

select 'Eliminación con motivo (Gerencia) lista.' as resultado;
