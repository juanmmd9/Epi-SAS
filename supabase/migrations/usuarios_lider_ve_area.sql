-- El líder ve los perfiles de su misma área. No cambia roles ni datos ya guardados.

create or replace function public.usuario_area()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select area from public.usuarios_portal where id = auth.uid() and activo = true),
    ''
  );
$$;

drop policy if exists "usuarios lider ve su area" on public.usuarios_portal;
create policy "usuarios lider ve su area" on public.usuarios_portal
  for select
  using (
    public.usuario_rol() = 'lider'
    and area is not null
    and area = public.usuario_area()
  );
