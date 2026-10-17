-- Rol gerencia (menú propio; se define después en el portal).
-- Ejecutar en Supabase → SQL Editor → Run
-- Luego redesplegar la Edge Function que crea usuarios (bright-api / crear-usuario-portal).

alter table public.usuarios_portal drop constraint if exists usuarios_portal_rol_check;
alter table public.usuarios_portal add constraint usuarios_portal_rol_check
  check (rol in ('admin', 'operador', 'consulta', 'solicitante', 'lider', 'gerencia'));

comment on constraint usuarios_portal_rol_check on public.usuarios_portal is
  'Roles del portal: admin, operador, consulta, solicitante, lider, gerencia.';

select 'Rol gerencia habilitado en usuarios_portal.' as resultado;
