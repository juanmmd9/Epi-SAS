-- Rol líder de área + aprobación de PM (MT-RE-045)
alter table public.usuarios_portal drop constraint if exists usuarios_portal_rol_check;
alter table public.usuarios_portal add constraint usuarios_portal_rol_check
  check (rol in ('admin', 'operador', 'consulta', 'solicitante', 'lider'));

comment on constraint usuarios_portal_rol_check on public.usuarios_portal is
  'Roles del portal: admin, operador, consulta, solicitante, lider (aprueba PM de su área).';
