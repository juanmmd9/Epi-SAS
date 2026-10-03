-- Actualiza el check de estados de permisos (incluye rechazado y cancelado).
-- Elimina CUALQUIER check previo sobre "estado" por si quedó uno con otro nombre.

do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'permisos_personal'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%estado%'
  loop
    execute format('alter table public.permisos_personal drop constraint if exists %I', r.conname);
  end loop;
end $$;

alter table public.permisos_personal
  add constraint permisos_personal_estado_check
  check (estado in (
    'borrador',
    'solicitado',
    'autorizado',
    'rechazado',
    'cancelado',
    'en_permiso',
    'cerrado'
  ));
