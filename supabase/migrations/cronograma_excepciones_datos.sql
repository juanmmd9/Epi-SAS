-- Columna datos en cronograma_excepciones (tipos excluir / agregar / no_realizado)
alter table cronograma_excepciones
  add column if not exists datos jsonb not null default '{}';
