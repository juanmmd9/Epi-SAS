-- =====================================================================
-- Si se inserta usuarios_portal sin "usuario", lo deriva del email.
-- Evita: null value in column "usuario" violates not-null constraint
-- =====================================================================

create or replace function public.usuarios_portal_rellenar_usuario()
returns trigger
language plpgsql
as $$
declare
  base text;
  candidato text;
  n int := 1;
begin
  if new.usuario is not null and btrim(new.usuario) <> '' then
    new.usuario := lower(btrim(new.usuario));
    return new;
  end if;

  base := lower(regexp_replace(split_part(coalesce(new.email, ''), '@', 1), '[^a-z0-9._-]', '', 'g'));
  if base is null or base = '' then
    base := 'user_' || substr(replace(new.id::text, '-', ''), 1, 12);
  end if;

  candidato := base;
  while exists (
    select 1 from public.usuarios_portal u
    where u.usuario = candidato and u.id is distinct from new.id
  ) loop
    n := n + 1;
    candidato := base || n::text;
  end loop;

  new.usuario := candidato;
  return new;
end;
$$;

drop trigger if exists trg_usuarios_portal_rellenar_usuario on public.usuarios_portal;
create trigger trg_usuarios_portal_rellenar_usuario
  before insert or update of usuario, email
  on public.usuarios_portal
  for each row
  execute function public.usuarios_portal_rellenar_usuario();

select 'Trigger listo: usuario se rellena solo si viene vacío.' as resultado;
