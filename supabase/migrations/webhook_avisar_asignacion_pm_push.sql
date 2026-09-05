-- Webhook push: al INSERT/UPDATE en preventivo_asignaciones avisa al operario asignado.
-- Requiere: preventivo_asignaciones.sql + función avisar-asignacion-pm-push desplegada.

create extension if not exists pg_net with schema extensions;

create or replace function public.webhook_avisar_asignacion_pm_push()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, net
as $$
declare
  payload jsonb;
begin
  if TG_OP = 'UPDATE' and OLD.personal_id is not distinct from NEW.personal_id then
    return NEW;
  end if;

  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', to_jsonb(NEW),
    'old_record', case when TG_OP = 'UPDATE' then to_jsonb(OLD) else null end
  );

  perform net.http_post(
    url := 'https://aowekaejzubqjuzdxrwx.supabase.co/functions/v1/avisar-asignacion-pm-push',
    body := payload,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    timeout_milliseconds := 10000
  );

  return NEW;
exception
  when others then
    raise warning 'webhook_avisar_asignacion_pm_push: %', SQLERRM;
    return NEW;
end;
$$;

drop trigger if exists trg_avisar_asignacion_pm_push on public.preventivo_asignaciones;

create trigger trg_avisar_asignacion_pm_push
  after insert or update on public.preventivo_asignaciones
  for each row
  execute function public.webhook_avisar_asignacion_pm_push();

select 'Webhook push: trigger trg_avisar_asignacion_pm_push en preventivo_asignaciones.' as resultado;
