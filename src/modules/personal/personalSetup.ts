/** SQL para crear la tabla personal en Supabase (SQL Editor → Run). */
export const SQL_MIGRACION_PERSONAL = `-- Tabla personal de mantenimiento
create table if not exists public.personal (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  cargo text,
  area text,
  cedula text,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

alter table public.preventivo
  add column if not exists personal_id uuid references public.personal (id) on delete set null;

alter table public.correctivo
  add column if not exists personal_id uuid references public.personal (id) on delete set null;

alter table public.personal enable row level security;

drop policy if exists "acceso temporal" on public.personal;
drop policy if exists "acceso temporal personal" on public.personal;
create policy "acceso temporal" on public.personal
  for all using (true) with check (true);
`;

export function faltaTablaPersonal(mensaje: string): boolean {
  return /public\.personal|schema cache|relation.*personal does not exist/i.test(mensaje);
}
