-- landing-contact.redesign — el owner movió "Evaluación" fuera de "Servicios destacados" (la reubicó como card
-- en la sección de contacto). Los destacados del home salen de is_featured=true (RPC _public_get_landing_home);
-- basta quitar el flag. Evaluación sigue publicada → aparece en el catálogo y su detail page /service/evaluacion.
-- Solo dato, scoped al tenant, idempotente.

update public.tenant_landing_services
set is_featured = false
where tenant_id = '61205cb9-1418-4bfa-a029-bbb44d4e4310'
  and slug = 'evaluacion';
