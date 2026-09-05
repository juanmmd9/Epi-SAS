-- Área por usuario + rol solicitante (personal de producción que reporta fallas)
alter table usuarios_portal add column if not exists area text;

alter table usuarios_portal drop constraint if exists usuarios_portal_rol_check;
alter table usuarios_portal add constraint usuarios_portal_rol_check
  check (rol in ('admin', 'operador', 'consulta', 'solicitante'));

create index if not exists idx_usuarios_portal_area on usuarios_portal (area);
