-- Seguimiento profesional Gerencia: historial, comentarios, cotizaciones, storage
-- Ejecutar en Supabase → SQL Editor → Run
-- (Después de gerencia_items.sql)

-- Campos extra en la solicitud
alter table public.gerencia_items
  add column if not exists impacto text default 'medio'
    check (impacto is null or impacto in ('bajo', 'medio', 'alto'));
alter table public.gerencia_items
  add column if not exists fecha_compromiso date;
alter table public.gerencia_items
  add column if not exists responsable_nombre text;
alter table public.gerencia_items
  add column if not exists cerrado_en timestamptz;
alter table public.gerencia_items
  add column if not exists confirmado_area boolean not null default false;

-- Historial / línea de tiempo
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

-- Comentarios área ↔ gerencia
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

-- Cotizaciones
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

-- Helper: ¿puede ver este ítem?
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

-- Líder puede confirmar recepción en sus ítems
drop policy if exists "gerencia_items actualizar" on public.gerencia_items;
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

-- BEFORE UPDATE: solo fecha de cierre (no puede ir en AFTER)
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

-- AFTER INSERT/UPDATE: historial (el ítem ya existe → FK ok)
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

-- Storage cotizaciones
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

select 'Seguimiento Gerencia (historial, comentarios, cotizaciones) listo.' as resultado;
