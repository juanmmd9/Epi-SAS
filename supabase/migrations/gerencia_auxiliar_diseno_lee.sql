-- El auxiliar de Diseño lee solo las cards que el director le asignó.

drop policy if exists "gerencia auxiliar diseno lee lo suyo" on public.gerencia_items;
create policy "gerencia auxiliar diseno lee lo suyo" on public.gerencia_items
  for select
  to authenticated
  using (
    public.usuario_rol() = 'solicitante'
    and lower(public.usuario_area()) = 'diseno y desarrollo'
    and auxiliar_id = auth.uid()
  );
