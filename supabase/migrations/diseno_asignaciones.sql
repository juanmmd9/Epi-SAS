-- Proyectos de Diseño asignados por el director a cada auxiliar.

create table if not exists public.diseno_asignaciones (
  usuario_id uuid primary key references public.usuarios_portal (id) on delete cascade,
  proyectos text[] not null default '{}',
  actualizado_en timestamptz not null default now(),
  constraint diseno_asignaciones_proyectos_check check (
    proyectos <@ array['alturas', 'plasticos', 'ingenieria']::text[]
  )
);

alter table public.diseno_asignaciones enable row level security;

drop policy if exists "diseno asignaciones del lider" on public.diseno_asignaciones;
create policy "diseno asignaciones del lider" on public.diseno_asignaciones
  for all
  to authenticated
  using (
    public.usuario_rol() = 'lider'
    and lower(public.usuario_area()) = 'diseno y desarrollo'
  )
  with check (
    public.usuario_rol() = 'lider'
    and lower(public.usuario_area()) = 'diseno y desarrollo'
    and exists (
      select 1
      from public.usuarios_portal u
      where u.id = usuario_id
        and u.activo = true
        and lower(coalesce(u.area, '')) = lower(public.usuario_area())
    )
  );

grant select, insert, update, delete on public.diseno_asignaciones to authenticated;
