alter table public.gerencia_items
  add column if not exists linea_diseno text,
  add column if not exists auxiliar_id uuid,
  add column if not exists etapa_diseno text;

alter table public.gerencia_items drop constraint if exists gerencia_items_linea_diseno_check;
alter table public.gerencia_items
  add constraint gerencia_items_linea_diseno_check
  check (linea_diseno is null or linea_diseno in ('alturas', 'plasticos', 'ingenieria'));

alter table public.gerencia_items drop constraint if exists gerencia_items_etapa_diseno_check;
alter table public.gerencia_items
  add constraint gerencia_items_etapa_diseno_check
  check (
    etapa_diseno is null
    or etapa_diseno in (
      'planificacion',
      'entradas',
      'casco',
      'herramental',
      'revision',
      'verificacion',
      'validacion',
      'decision',
      'cambios',
      'salidas',
      'serie'
    )
  );
