-- Estado "rechazado" para flujo de aprobación GH-RE-030
alter table public.permisos_personal drop constraint if exists permisos_personal_estado_check;
alter table public.permisos_personal
  add constraint permisos_personal_estado_check
  check (estado in ('borrador', 'solicitado', 'autorizado', 'rechazado', 'en_permiso', 'cerrado'));
