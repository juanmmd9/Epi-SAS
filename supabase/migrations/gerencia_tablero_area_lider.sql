-- Líderes pueden crear/editar/borrar columnas de su tablero de área (id area_*)
-- Ejecutar en Supabase → SQL Editor → Run

drop policy if exists "gerencia_tableros escribir" on public.gerencia_tableros;

create policy "gerencia_tableros escribir" on public.gerencia_tableros
  for all using (
    public.usuario_rol() in ('gerencia', 'admin')
    or (
      public.usuario_rol() = 'lider'
      and id like 'area_%'
    )
  )
  with check (
    public.usuario_rol() in ('gerencia', 'admin')
    or (
      public.usuario_rol() = 'lider'
      and id like 'area_%'
    )
  );

select 'Líderes pueden gestionar columnas area_* .' as resultado;
