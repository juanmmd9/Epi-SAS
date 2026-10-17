-- =====================================================================
-- Login híbrido: usuario (operarios) O correo (cuentas actuales)
--
-- Supabase → SQL Editor → Run.
--
-- - Cuentas existentes (Gmail / @epi.com): se conservan. Entran con su correo
--   o con el "usuario" que se genera desde la parte local del email.
-- - Operarios nuevos (desde el portal): usuario + contraseña; Auth usa
--   usuario@epi.local por debajo.
-- =====================================================================

alter table public.usuarios_portal
  add column if not exists usuario text;

-- Rellenar usuario desde la parte local del email (sin tocar el email real)
update public.usuarios_portal
set usuario = lower(regexp_replace(split_part(email, '@', 1), '[^a-z0-9._-]', '', 'g'))
where usuario is null or btrim(usuario) = '';

update public.usuarios_portal
set usuario = 'user_' || substr(replace(id::text, '-', ''), 1, 12)
where usuario is null or btrim(usuario) = '';

-- Resolver duplicados
with ranked as (
  select
    id,
    usuario,
    row_number() over (partition by usuario order by creado_en nulls last, id) as rn
  from public.usuarios_portal
)
update public.usuarios_portal u
set usuario = ranked.usuario || ranked.rn::text
from ranked
where u.id = ranked.id
  and ranked.rn > 1;

with dups as (
  select usuario
  from public.usuarios_portal
  group by usuario
  having count(*) > 1
)
update public.usuarios_portal u
set usuario = lower(regexp_replace(split_part(u.email, '@', 1), '[^a-z0-9._-]', '', 'g'))
  || '_' || substr(replace(u.id::text, '-', ''), 1, 8)
where u.usuario in (select usuario from dups)
  and u.id not in (
    select distinct on (usuario) id
    from public.usuarios_portal
    where usuario in (select usuario from dups)
    order by usuario, creado_en nulls last, id
  );

alter table public.usuarios_portal
  alter column usuario set not null;

create unique index if not exists idx_usuarios_portal_usuario
  on public.usuarios_portal (usuario);

-- Alinear email del perfil con Auth (conserva Gmail / correos reales)
update public.usuarios_portal u
set email = a.email
from auth.users a
where u.id = a.id
  and a.email is not null
  and u.email is distinct from a.email;

comment on column public.usuarios_portal.usuario is
  'Nombre de inicio de sesión. Operarios nuevos: Auth = usuario@epi.local. Cuentas viejas: pueden seguir con su correo real.';

-- Lookup público (anon) para login: usuario o correo → email Auth
create or replace function public.email_auth_por_login(p_login text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email
  from public.usuarios_portal
  where activo = true
    and (
      usuario = lower(btrim(p_login))
      or lower(email) = lower(btrim(p_login))
    )
  limit 1;
$$;

revoke all on function public.email_auth_por_login(text) from public;
grant execute on function public.email_auth_por_login(text) to anon, authenticated;

select 'Listo: columna usuario + login por usuario o correo. No se cambian emails Auth existentes.' as resultado;
