-- Cada área solo ve y guarda sus registros de GC-RE-027.
alter table public.gestion_cambio add column if not exists area text;

update public.gestion_cambio
set area = 'Mantenimiento'
where area is null or btrim(area) = '';

drop policy if exists "acceso temporal gestion_cambio" on public.gestion_cambio;
drop policy if exists "gestion cambio por area" on public.gestion_cambio;

create policy "gestion cambio por area" on public.gestion_cambio
  for all
  using (
    public.usuario_rol() = 'admin'
    or (
      area is not null
      and lower(area) = lower(public.usuario_area())
    )
  )
  with check (
    public.usuario_rol() = 'admin'
    or (
      area is not null
      and lower(area) = lower(public.usuario_area())
    )
  );
