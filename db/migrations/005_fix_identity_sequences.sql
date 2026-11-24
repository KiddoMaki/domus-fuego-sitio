-- Sincroniza todas las secuencias identity con el ID máximo existente.
-- Necesario después de importar DomusDBs.sql con datos: las secuencias quedaron en 1.
do $$
declare
  fila record;
begin
  for fila in
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public' and identity_generation is not null
  loop
    execute format(
      'select setval(pg_get_serial_sequence(%L, %L), coalesce((select max(%I) from public.%I), 1), exists (select 1 from public.%I))',
      'public.' || fila.table_name,
      fila.column_name,
      fila.column_name,
      fila.table_name,
      fila.table_name
    );
  end loop;
end $$;
