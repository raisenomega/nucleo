-- Migración 159: block-2-close cleanup (solo Zafacones).
-- 1. Obligaciones fiscales en $0: tax_obligation_rules estaba VACÍO para Zafacones (preset PR nunca sembrado) →
--    cascada $0 pese a tener $2,035 de income. Se siembra el preset PR (guardado: solo si no hay reglas → idempotente).
do $$ begin
  if not exists (select 1 from public.tax_obligation_rules where tenant_id='61205cb9-1418-4bfa-a029-bbb44d4e4310') then
    perform public.seed_pr_fiscal_preset('61205cb9-1418-4bfa-a029-bbb44d4e4310');
  end if;
end $$;

-- 2. Display precio Suscripción Regular → "Desde $19.98" (min tier de la matrix_1d). service.price es display-only:
--    el motor cobra por matrix_1d (base por frecuencia), no por este campo.
update public.tenant_landing_services set pricing_type='starting_from', price=19.98
  where tenant_id='61205cb9-1418-4bfa-a029-bbb44d4e4310' and slug='servicio-mensual-regular';

-- 3. Regla painting:15 residuo: el motor _public_price_order nunca referencia 'painting'; el service "Pintura de
--    Tapas" ya tiene su flat $15. Se elimina la regla muerta.
delete from public.tenant_pricing_rules
  where id='22222222-0000-4000-a000-000000000004' and tenant_id='61205cb9-1418-4bfa-a029-bbb44d4e4310'
    and rule_type='flat' and config->>'painting'='15';
