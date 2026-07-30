-- LANDING-FORMS-PRICING Rodaja 1.4: separar el hook/promo de los cards de servicio → precio regular puro.
-- El promo ($19.98 primer mes / $27.99 recurrente STALE — el real es $39.99 tras Rodaja 1.2) vive en
-- tenant_landing_config.promo_offer (popup/toast "OFERTA TRENDING" site-wide, apunta a Membresía Regular) y se
-- mostraba también sobre el card de Soterrados. El coupon pXDGmo5K está muerto (nada pasa su código). Ambos se
-- DESACTIVAN (no se dropean) → 100% reversible (rollback = is_active=true). El hook renace limpio en Rodaja 2.
-- Los forms están textualmente limpios y consistentes (auditados) → no requieren cambios.

-- 1) Apagar el promo_offer (fuente real de la contaminación de copy + precios viejos en los cards).
update public.tenant_landing_config
  set promo_offer = jsonb_set(promo_offer, '{is_active}', 'false'::jsonb)
  where tenant_id = '61205cb9-1418-4bfa-a029-bbb44d4e4310' and promo_offer ? 'is_active';

-- 2) Apagar la regla coupon vestigial (inalcanzable: no referenciada en código ni en promo_offer.coupon_code).
update public.tenant_pricing_rules set is_active = false, updated_at = now()
  where id = '22222222-0000-4000-a000-000000000005' and rule_type = 'coupon' and config->>'code' = 'pXDGmo5K';
