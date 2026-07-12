-- Migración 138: landing_enabled pasa a feature base (default true) + backfill de tenants existentes.
-- El bloqueo comercial (add-on) se reintroduce por suscripción cuando llegue el billing SaaS (Flujo 2 Stripe).
alter table public.tenants alter column landing_enabled set default true;
update public.tenants set landing_enabled = true where landing_enabled = false;
