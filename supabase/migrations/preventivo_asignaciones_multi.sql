-- Permitir varios operarios por la misma cita PM (máquina + fecha).
-- Ejecutar en Supabase → SQL Editor → Run
-- (Si aún no creaste la tabla, ejecuta primero preventivo_asignaciones.sql)

alter table public.preventivo_asignaciones
  drop constraint if exists preventivo_asignaciones_hoja_id_fecha_programada_key;

-- Nombre alternativo que Postgres a veces genera:
alter table public.preventivo_asignaciones
  drop constraint if exists preventivo_asignaciones_hoja_id_fecha_programada_unique;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.preventivo_asignaciones'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) like '%(hoja_id, fecha_programada)%'
      and pg_get_constraintdef(oid) not like '%personal_id%'
  ) then
    execute (
      select format('alter table public.preventivo_asignaciones drop constraint %I', conname)
      from pg_constraint
      where conrelid = 'public.preventivo_asignaciones'::regclass
        and contype = 'u'
        and pg_get_constraintdef(oid) like '%(hoja_id, fecha_programada)%'
        and pg_get_constraintdef(oid) not like '%personal_id%'
      limit 1
    );
  end if;
end $$;

alter table public.preventivo_asignaciones
  drop constraint if exists preventivo_asignaciones_hoja_fecha_personal_key;

alter table public.preventivo_asignaciones
  add constraint preventivo_asignaciones_hoja_fecha_personal_key
  unique (hoja_id, fecha_programada, personal_id);

select 'Asignación múltiple de PM habilitada (hoja + fecha + personal).' as resultado;
