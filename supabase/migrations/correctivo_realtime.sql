-- Habilitar avisos en tiempo real para nuevas solicitudes correctivas
-- Ejecutar en Supabase → SQL Editor si no llegan alertas "En vivo"

alter table correctivo replica identity full;

do $$
begin
  alter publication supabase_realtime add table correctivo;
exception
  when duplicate_object then null;
end $$;

select 'Realtime activado para tabla correctivo.' as resultado;
