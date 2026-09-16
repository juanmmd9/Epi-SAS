-- Bandeja + claim: quita auto-asignar a todos del área.
-- Ejecutar en Supabase → SQL Editor → Run
-- (después de correctivo_asignaciones.sql)

-- Ya no se asignan solos todos los operarios del área.
drop trigger if exists trg_auto_asignar_solicitud_area on public.correctivo;

-- Permitir origen 'claim' (operario toma la solicitud).
alter table public.correctivo_asignaciones
  drop constraint if exists correctivo_asignaciones_origen_check;

alter table public.correctivo_asignaciones
  add constraint correctivo_asignaciones_origen_check
  check (origen in ('auto_area', 'manual', 'claim'));

-- Opcional: liberar a bandeja las que se auto-asignaron a todos (abiertas).
-- Comenta este bloque si quieres conservar esas asignaciones.
delete from public.correctivo_asignaciones ca
using public.correctivo c
where ca.correctivo_id = c.id
  and ca.origen = 'auto_area'
  and coalesce(c.datos->>'fechaCierre', '') = '';

select 'Bandeja + claim: auto-asignación desactivada.' as resultado;
