-- Setup completo Gerencia (todo en orden).
-- Ejecutar UNA vez en Supabase → SQL Editor → Run
-- Idempotente: se puede volver a ejecutar sin romper datos.

-- ========== 1) Items ==========
create table if not exists public.gerencia_items (
  id uuid primary key default gen_random_uuid(),
  tablero text not null default 'por_clasificar',
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
    check (estado in ('pendiente', 'en_proceso', 'hecho', 'pausado', 'eliminado')),
  orden integer not null default 0,
  urgencia text not null default 'media'
    check (urgencia in ('baja', 'media', 'alta')),
  monto numeric(14, 2),
  proveedor text,
  notas text,
  origen text not null default 'solicitud'
    check (origen in ('solicitud', 'gerencia')),
  motivo_eliminacion text,
  eliminado_en timestamptz,
  eliminado_por_nombre text,
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

create policy "gerencia_items leer" on public.gerencia_items
  for select using (
    public.usuario_rol() in ('gerencia', 'admin')
    or (
      public.usuario_rol() = 'lider'
      and solicitante_id = auth.uid()
    )
  );

create policy "gerencia_items insertar" on public.gerencia_items
  for insert with check (
    public.usuario_rol() in ('gerencia', 'admin', 'lider')
  );

create policy "gerencia_items actualizar" on public.gerencia_items
  for update using (
    public.usuario_rol() in ('gerencia', 'admin')
    or (
      public.usuario_rol() = 'lider'
      and solicitante_id = auth.uid()
    )
  )
  with check (
    public.usuario_rol() in ('gerencia', 'admin')
    or (
      public.usuario_rol() = 'lider'
      and solicitante_id = auth.uid()
    )
  );

create policy "gerencia_items borrar" on public.gerencia_items
  for delete using (
    public.usuario_rol() in ('gerencia', 'admin')
  );

-- ========== 2) Campos + historial / comentarios / cotizaciones ==========
alter table public.gerencia_items
  add column if not exists impacto text default 'medio';
alter table public.gerencia_items
  add column if not exists fecha_compromiso date;
alter table public.gerencia_items
  add column if not exists responsable_nombre text;
alter table public.gerencia_items
  add column if not exists cerrado_en timestamptz;
alter table public.gerencia_items
  add column if not exists confirmado_area boolean not null default false;
alter table public.gerencia_items
  add column if not exists motivo_eliminacion text;
alter table public.gerencia_items
  add column if not exists eliminado_en timestamptz;
alter table public.gerencia_items
  add column if not exists eliminado_por_nombre text;

alter table public.gerencia_items drop constraint if exists gerencia_items_estado_check;
alter table public.gerencia_items
  add constraint gerencia_items_estado_check
  check (estado in ('pendiente', 'en_proceso', 'hecho', 'pausado', 'eliminado'));

create table if not exists public.gerencia_historial (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.gerencia_items (id) on delete cascade,
  tipo text not null,
  detalle text,
  autor_id uuid references auth.users (id) on delete set null,
  autor_nombre text,
  creado_en timestamptz not null default now()
);

create index if not exists gerencia_historial_item_idx
  on public.gerencia_historial (item_id, creado_en desc);

create table if not exists public.gerencia_comentarios (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.gerencia_items (id) on delete cascade,
  mensaje text not null,
  autor_id uuid references auth.users (id) on delete set null,
  autor_nombre text,
  creado_en timestamptz not null default now()
);

create index if not exists gerencia_comentarios_item_idx
  on public.gerencia_comentarios (item_id, creado_en asc);

create table if not exists public.gerencia_cotizaciones (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.gerencia_items (id) on delete cascade,
  proveedor text not null,
  monto numeric(14, 2),
  moneda text not null default 'COP',
  vigencia date,
  archivo_url text,
  archivo_nombre text,
  elegida boolean not null default false,
  notas text,
  autor_id uuid references auth.users (id) on delete set null,
  autor_nombre text,
  creado_en timestamptz not null default now()
);

create index if not exists gerencia_cotizaciones_item_idx
  on public.gerencia_cotizaciones (item_id, creado_en desc);

create or replace function public.puede_ver_gerencia_item(p_item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.gerencia_items i
    where i.id = p_item_id
      and (
        public.usuario_rol() in ('gerencia', 'admin')
        or (public.usuario_rol() = 'lider' and i.solicitante_id = auth.uid())
      )
  );
$$;

alter table public.gerencia_historial enable row level security;
alter table public.gerencia_comentarios enable row level security;
alter table public.gerencia_cotizaciones enable row level security;

drop policy if exists "gerencia_hist leer" on public.gerencia_historial;
drop policy if exists "gerencia_hist insertar" on public.gerencia_historial;
drop policy if exists "gerencia_com leer" on public.gerencia_comentarios;
drop policy if exists "gerencia_com insertar" on public.gerencia_comentarios;
drop policy if exists "gerencia_cot leer" on public.gerencia_cotizaciones;
drop policy if exists "gerencia_cot insertar" on public.gerencia_cotizaciones;
drop policy if exists "gerencia_cot actualizar" on public.gerencia_cotizaciones;
drop policy if exists "gerencia_cot borrar" on public.gerencia_cotizaciones;

create policy "gerencia_hist leer" on public.gerencia_historial
  for select using (public.puede_ver_gerencia_item(item_id));

create policy "gerencia_hist insertar" on public.gerencia_historial
  for insert with check (
    public.puede_ver_gerencia_item(item_id)
    and public.usuario_rol() in ('gerencia', 'admin', 'lider')
  );

create policy "gerencia_com leer" on public.gerencia_comentarios
  for select using (public.puede_ver_gerencia_item(item_id));

create policy "gerencia_com insertar" on public.gerencia_comentarios
  for insert with check (
    public.puede_ver_gerencia_item(item_id)
    and public.usuario_rol() in ('gerencia', 'admin', 'lider')
  );

create policy "gerencia_cot leer" on public.gerencia_cotizaciones
  for select using (public.puede_ver_gerencia_item(item_id));

create policy "gerencia_cot insertar" on public.gerencia_cotizaciones
  for insert with check (
    public.puede_ver_gerencia_item(item_id)
    and public.usuario_rol() in ('gerencia', 'admin', 'lider')
  );

create policy "gerencia_cot actualizar" on public.gerencia_cotizaciones
  for update using (
    public.usuario_rol() in ('gerencia', 'admin')
    and public.puede_ver_gerencia_item(item_id)
  )
  with check (
    public.usuario_rol() in ('gerencia', 'admin')
    and public.puede_ver_gerencia_item(item_id)
  );

create policy "gerencia_cot borrar" on public.gerencia_cotizaciones
  for delete using (
    public.usuario_rol() in ('gerencia', 'admin')
    and public.puede_ver_gerencia_item(item_id)
  );

create or replace function public.gerencia_item_cerrado_trg()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado is distinct from old.estado
     and new.estado = 'hecho'
     and new.cerrado_en is null then
    new.cerrado_en := now();
  end if;
  return new;
end;
$$;

create or replace function public.gerencia_item_historial_trg()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.gerencia_historial (item_id, tipo, detalle, autor_id, autor_nombre)
    values (
      new.id,
      'creada',
      'Solicitud creada · ' || coalesce(new.tablero, 'por_clasificar'),
      new.solicitante_id,
      new.solicitante_nombre
    );
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.tablero is distinct from old.tablero then
      insert into public.gerencia_historial (item_id, tipo, detalle)
      values (
        new.id,
        'tablero',
        'Tablero: ' || coalesce(old.tablero, '?') || ' → ' || coalesce(new.tablero, '?')
      );
    end if;
    if new.estado is distinct from old.estado then
      insert into public.gerencia_historial (item_id, tipo, detalle)
      values (
        new.id,
        'estado',
        'Estado: ' || coalesce(old.estado, '?') || ' → ' || coalesce(new.estado, '?')
      );
    end if;
    if new.confirmado_area is distinct from old.confirmado_area and new.confirmado_area = true then
      insert into public.gerencia_historial (item_id, tipo, detalle)
      values (new.id, 'confirmacion', 'El área confirmó recepción / cierre');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists gerencia_items_historial on public.gerencia_items;
drop trigger if exists gerencia_items_cerrado on public.gerencia_items;

create trigger gerencia_items_cerrado
  before update on public.gerencia_items
  for each row execute function public.gerencia_item_cerrado_trg();

create trigger gerencia_items_historial
  after insert or update on public.gerencia_items
  for each row execute function public.gerencia_item_historial_trg();

insert into storage.buckets (id, name, public)
values ('gerencia-cotizaciones', 'gerencia-cotizaciones', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "gerencia cot leer" on storage.objects;
drop policy if exists "gerencia cot subir" on storage.objects;
drop policy if exists "gerencia cot borrar" on storage.objects;

create policy "gerencia cot leer" on storage.objects
  for select using (
    bucket_id = 'gerencia-cotizaciones'
    and public.usuario_autenticado()
  );

create policy "gerencia cot subir" on storage.objects
  for insert with check (
    bucket_id = 'gerencia-cotizaciones'
    and public.usuario_rol() in ('gerencia', 'admin', 'lider')
  );

create policy "gerencia cot borrar" on storage.objects
  for delete using (
    bucket_id = 'gerencia-cotizaciones'
    and public.usuario_rol() in ('gerencia', 'admin')
  );

-- ========== 3) Columnas del tablero ==========
create table if not exists public.gerencia_tableros (
  id text primary key,
  etiqueta text not null,
  orden integer not null default 100,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

insert into public.gerencia_tableros (id, etiqueta, orden) values
  ('por_clasificar', 'Por clasificar', 10),
  ('lucro_cesante', 'Lucro cesante', 20),
  ('china', 'China proveedor', 30),
  ('compras_cali', 'Compras Cali', 40),
  ('impo', 'IMPO', 50),
  ('safety', 'Safety', 60),
  ('gerencia', 'Gerencia', 70),
  ('ventas', 'Ventas', 80)
on conflict (id) do update set
  etiqueta = excluded.etiqueta,
  orden = excluded.orden,
  activo = true;

alter table public.gerencia_items drop constraint if exists gerencia_items_tablero_check;

alter table public.gerencia_tableros enable row level security;

drop policy if exists "gerencia_tableros leer" on public.gerencia_tableros;
drop policy if exists "gerencia_tableros escribir" on public.gerencia_tableros;

create policy "gerencia_tableros leer" on public.gerencia_tableros
  for select using (public.usuario_autenticado());

create policy "gerencia_tableros escribir" on public.gerencia_tableros
  for all using (public.usuario_rol() in ('gerencia', 'admin'))
  with check (public.usuario_rol() in ('gerencia', 'admin'));

-- ========== 4) Realtime ==========
alter table public.gerencia_items replica identity full;
alter table public.gerencia_tableros replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.gerencia_items;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.gerencia_tableros;
exception
  when duplicate_object then null;
end $$;

select 'Setup completo Gerencia listo.' as resultado;
