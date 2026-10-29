-- Tablero de Gerencia: proyectos, compras y máquinas
-- Ejecutar en Supabase → SQL Editor → Run

create table if not exists public.gerencia_items (
  id uuid primary key default gen_random_uuid(),
  tablero text not null default 'por_clasificar'
    check (tablero in (
      'por_clasificar',
      'lucro_cesante',
      'china',
      'compras_cali',
      'impo',
      'safety',
      'gerencia',
      'ventas'
    )),
  titulo text not null,
  tipo text not null default 'proyecto'
    check (tipo in (
      'proyecto',
      'compra_internacional',
      'compra_local',
      'maquina',
      'otro'
    )),
  area text,
  solicitante_id uuid references auth.users (id) on delete set null,
  solicitante_nombre text,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'en_proceso', 'hecho', 'pausado')),
  orden integer not null default 0,
  urgencia text not null default 'media'
    check (urgencia in ('baja', 'media', 'alta')),
  monto numeric(14, 2),
  proveedor text,
  notas text,
  origen text not null default 'solicitud'
    check (origen in ('solicitud', 'gerencia')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists gerencia_items_tablero_idx on public.gerencia_items (tablero, orden);
create index if not exists gerencia_items_solicitante_idx on public.gerencia_items (solicitante_id);
create index if not exists gerencia_items_estado_idx on public.gerencia_items (estado);

alter table public.gerencia_items enable row level security;

drop policy if exists "gerencia_items leer" on public.gerencia_items;
drop policy if exists "gerencia_items insertar" on public.gerencia_items;
drop policy if exists "gerencia_items actualizar" on public.gerencia_items;
drop policy if exists "gerencia_items borrar" on public.gerencia_items;

-- Gerencia y admin ven todo; líder solo lo que pidió
create policy "gerencia_items leer" on public.gerencia_items
  for select using (
    public.usuario_rol() in ('gerencia', 'admin')
    or (
      public.usuario_rol() = 'lider'
      and solicitante_id = auth.uid()
    )
  );

-- Admin, líder y gerencia pueden crear
create policy "gerencia_items insertar" on public.gerencia_items
  for insert with check (
    public.usuario_rol() in ('gerencia', 'admin', 'lider')
  );

-- Solo gerencia y admin mueven / editan el tablero
create policy "gerencia_items actualizar" on public.gerencia_items
  for update using (
    public.usuario_rol() in ('gerencia', 'admin')
  )
  with check (
    public.usuario_rol() in ('gerencia', 'admin')
  );

create policy "gerencia_items borrar" on public.gerencia_items
  for delete using (
    public.usuario_rol() in ('gerencia', 'admin')
  );

select 'Tabla gerencia_items lista.' as resultado;
