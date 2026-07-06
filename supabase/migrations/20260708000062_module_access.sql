-- Accesos configurables por modulo. null = usa defaults del rol; jsonb = personalizado por el CEO.
alter table public.employee_details
  add column module_access jsonb default null;

comment on column public.employee_details.module_access is
  'Permisos por modulo {mod:{view,create,edit,delete}}. null -> defaults del rol (ROLE_DEFAULTS).';
