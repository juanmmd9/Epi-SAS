-- Registro propio: solo corre cuando el alta trae registro_propio = 1.
-- No actualiza ni borra perfiles ya creados por el administrador.

create or replace function public.perfil_desde_registro_propio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb;
  v_rol text;
  v_area text;
  v_nombre text;
begin
  meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  if coalesce(meta->>'registro_propio', '') <> '1' then
    return new;
  end if;

  if exists (
    select 1
    from public.usuarios_portal
    where id = new.id
       or lower(email) = lower(coalesce(new.email, ''))
  ) then
    raise exception 'Ese correo ya tiene un perfil en el portal';
  end if;

  v_rol := lower(btrim(coalesce(meta->>'rol', '')));
  if v_rol not in ('operador', 'consulta', 'solicitante', 'lider', 'gerencia') then
    raise exception 'Rol no permitido en el registro';
  end if;

  v_area := nullif(btrim(coalesce(meta->>'area', '')), '');
  if v_area is null then
    raise exception 'Elige el área';
  end if;

  v_nombre := nullif(btrim(coalesce(meta->>'nombre', '')), '');
  if v_nombre is null then
    raise exception 'Escribe el nombre';
  end if;

  insert into public.usuarios_portal (id, usuario, email, nombre, rol, area, activo)
  values (
    new.id,
    null,
    lower(btrim(new.email)),
    v_nombre,
    v_rol,
    v_area,
    true
  );

  return new;
end;
$$;

drop trigger if exists trg_auth_registro_propio on auth.users;
create trigger trg_auth_registro_propio
  after insert on auth.users
  for each row
  execute function public.perfil_desde_registro_propio();
