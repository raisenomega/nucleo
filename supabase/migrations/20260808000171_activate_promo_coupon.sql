-- coupons-full P3 — activar la promo pXDGmo5K. La promo (first_cycle $19.98 / recurring $27.99) ya vivía en
-- tenant_pricing_rules (rule_type='coupon', is_active=true), y _public_price_order la aplica por su branch
-- mutuamente exclusivo (si hay pricing_rule promo, NO consulta tenant_coupons). PERO _public_create_order exige
-- un tenant_coupons ACTIVO para aceptar el código en el checkout — y esa fila estaba is_active=false (placeholder).
-- Activarla cierra la inconsistencia preview-vs-submit sin tocar el motor de precios (value=0 nunca se usa: la
-- promo gana por pricing_rule). Solo dato, scoped al tenant, idempotente.

update public.tenant_coupons
set is_active = true
where tenant_id = '61205cb9-1418-4bfa-a029-bbb44d4e4310'
  and code = 'pXDGmo5K';
