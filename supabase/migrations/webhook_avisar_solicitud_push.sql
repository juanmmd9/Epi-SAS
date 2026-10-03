-- Webhook (paso 4 push): al INSERT en correctivo llama la Edge Function avisar-solicitud-push.
-- Requiere: función desplegada + secreto FIREBASE_SERVICE_ACCOUNT_JSON.
-- Usa pg_net (async, no bloquea el INSERT).

create extension if not exists pg_net with schema extensions;

create or replace function public.webhook_avisar_solicitud_push()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, net
as $$
declare
  payload jsonb;
  fcierre text;
begin
  fcierre := coalesce(NEW.datos->>'fechaCierre', '');
  if fcierre <> '' then
    return NEW;
  end if;

  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', to_jsonb(NEW)
  );

  perform net.http_post(
    url := 'https://aowekaejzubqjuzdxrwx.supabase.co/functions/v1/avisar-solicitud-push',
    body := payload,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    timeout_milliseconds := 10000
  );

  return NEW;
exception
  when others then
    -- No impedir la creación de la solicitud si falla el aviso push.
    raise warning 'webhook_avisar_solicitud_push: %', SQLERRM;
    return NEW;
end;
$$;

drop trigger if exists trg_avisar_solicitud_push on public.correctivo;

create trigger trg_avisar_solicitud_push
  after insert on public.correctivo
  for each row
  execute function public.webhook_avisar_solicitud_push();

comment on function public.webhook_avisar_solicitud_push() is
  'Envía push FCM vía Edge Function cuando se crea una solicitud correctiva abierta.';

select 'Webhook push: trigger trg_avisar_solicitud_push en correctivo.' as resultado;
