alter table public.compras_mantenimiento
  add column if not exists clave text;

create unique index if not exists compras_mantenimiento_clave_idx
  on public.compras_mantenimiento (clave);
