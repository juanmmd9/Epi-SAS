-- Solicitante de área: puede crear solicitudes correctivas y ver el tablero
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

-- Lectura de correctivo ya cubre a autenticados; reforzar insert para solicitante
drop policy if exists "auth escribir correctivo" on correctivo;
create policy "auth escribir correctivo" on correctivo
  for insert with check (public.usuario_puede_escribir());

drop policy if exists "auth actualizar correctivo" on correctivo;
create policy "auth actualizar correctivo" on correctivo
  for update using (
    public.usuario_rol() in ('admin', 'operador')
    or (
      public.usuario_rol() = 'solicitante'
      and area = (select area from usuarios_portal where id = auth.uid())
    )
  )
  with check (
    public.usuario_rol() in ('admin', 'operador')
    or (
      public.usuario_rol() = 'solicitante'
      and area = (select area from usuarios_portal where id = auth.uid())
    )
  );

-- Repuestos: solicitante puede crear en su área
drop policy if exists "auth escribir solicitudes_repuestos" on solicitudes_repuestos;
drop policy if exists "auth leer solicitudes_repuestos" on solicitudes_repuestos;
drop policy if exists "auth actualizar solicitudes_repuestos" on solicitudes_repuestos;

do $$
begin
  if to_regclass('public.solicitudes_repuestos') is not null then
    execute 'alter table solicitudes_repuestos enable row level security';
    execute 'drop policy if exists "auth leer solicitudes_repuestos" on solicitudes_repuestos';
    execute 'create policy "auth leer solicitudes_repuestos" on solicitudes_repuestos for select using (public.usuario_autenticado())';
    execute 'drop policy if exists "auth escribir solicitudes_repuestos" on solicitudes_repuestos';
    execute 'create policy "auth escribir solicitudes_repuestos" on solicitudes_repuestos for insert with check (public.usuario_puede_escribir())';
    execute 'drop policy if exists "auth actualizar solicitudes_repuestos" on solicitudes_repuestos';
    execute $p$
      create policy "auth actualizar solicitudes_repuestos" on solicitudes_repuestos
        for update using (
          public.usuario_rol() in ('admin', 'operador')
          or (
            public.usuario_rol() = 'solicitante'
            and area = (select area from usuarios_portal where id = auth.uid())
          )
        )
        with check (
          public.usuario_rol() in ('admin', 'operador')
          or (
            public.usuario_rol() = 'solicitante'
            and area = (select area from usuarios_portal where id = auth.uid())
          )
        )
    $p$;
  end if;
end $$;

select 'Solicitante puede ver tablero y crear solicitudes en su área.' as resultado;
