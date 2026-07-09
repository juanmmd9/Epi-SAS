-- Solicitante puede crear/actualizar solicitudes en CUALQUIER área
-- (un mismo perfil atiende todas las áreas).
-- Ejecutar en Supabase → SQL Editor

create or replace function public.usuario_puede_escribir()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.usuario_rol() in ('admin', 'operador', 'solicitante');
$$;

-- Correctivo: insert/update para quien puede escribir (sin filtrar por área del perfil)
drop policy if exists "auth escribir correctivo" on correctivo;
create policy "auth escribir correctivo" on correctivo
  for insert with check (public.usuario_puede_escribir());

drop policy if exists "auth actualizar correctivo" on correctivo;
create policy "auth actualizar correctivo" on correctivo
  for update using (public.usuario_puede_escribir())
  with check (public.usuario_puede_escribir());

-- Repuestos: misma regla
drop policy if exists "auth escribir solicitudes_repuestos" on solicitudes_repuestos;
drop policy if exists "auth actualizar solicitudes_repuestos" on solicitudes_repuestos;

do $$
begin
  if to_regclass('public.solicitudes_repuestos') is not null then
    execute 'alter table solicitudes_repuestos enable row level security';
    execute 'drop policy if exists "auth escribir solicitudes_repuestos" on solicitudes_repuestos';
    execute 'create policy "auth escribir solicitudes_repuestos" on solicitudes_repuestos for insert with check (public.usuario_puede_escribir())';
    execute 'drop policy if exists "auth actualizar solicitudes_repuestos" on solicitudes_repuestos';
    execute 'create policy "auth actualizar solicitudes_repuestos" on solicitudes_repuestos for update using (public.usuario_puede_escribir()) with check (public.usuario_puede_escribir())';
  end if;
end $$;

select 'Solicitante puede crear solicitudes en cualquier área.' as resultado;
