-- Webhook push: al INSERT en correctivo_asignaciones avisa al operario asignado (admin).
-- Requiere: función avisar-asignacion-correctivo-push desplegada.
-- Ejecutar en Supabase → SQL Editor → Run

create extension if not exists pg_net with schema extensions;

create or replace function public.webhook_avisar_asignacion_correctivo_push()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, net
as $$
declare
  payload jsonb;
begin
  -- Claim del propio operario: no avisar.
  if coalesce(NEW.origen, '') = 'claim' then
    return NEW;
  end if;

  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', to_jsonb(NEW)
  );

  perform net.http_post(
    url := 'https://aowekaejzubqjuzdxrwx.supabase.co/functions/v1/avisar-asignacion-correctivo-push',
    body := payload,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    timeout_milliseconds := 10000
  );

  return NEW;
exception
  when others then
    raise warning 'webhook_avisar_asignacion_correctivo_push: %', SQLERRM;
    return NEW;
end;
$$;

drop trigger if exists trg_avisar_asignacion_correctivo_push on public.correctivo_asignaciones;

create trigger trg_avisar_asignacion_correctivo_push
  after insert on public.correctivo_asignaciones
  for each row
  execute function public.webhook_avisar_asignacion_correctivo_push();

-- Realtime para que el operario vea Mis solicitudes sin reiniciar la app.
do $$
begin
  alter publication supabase_realtime add table public.correctivo_asignaciones;
exception
  when duplicate_object then null;
  when undefined_object then
    raise notice 'Publicación supabase_realtime no disponible; activa Realtime en el dashboard.';
end $$;

select 'Webhook push + realtime correctivo_asignaciones listos.' as resultado;
