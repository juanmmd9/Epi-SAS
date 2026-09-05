alter table cronograma_excepciones
  add column if not exists datos jsonb not null default '{}';
