-- La bitácora se guardaba como timestamp sin zona en UTC; JS la mostraba tal cual.
-- Al convertirla a timestamptz, el navegador la presenta en la zona local del usuario.
alter table public.auditoria_log
  alter column fecha type timestamp with time zone
  using fecha at time zone 'UTC';
