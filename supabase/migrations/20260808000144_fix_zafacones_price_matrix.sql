-- Migración 144: fix correctivo — matriz de precios soterrados de Zafacones a los valores reales del legacy.
-- El seed 2.5 (migr 143) usó valores del spec con typos en filas 6w/8w. Se corrigen 6w×3 (78→79) y 8w×2 (60→64.99).
-- Idempotente: jsonb_set del key 'matrix' (preserva axis_x/axis_y). Solo tenant roy-ramos.
update public.tenant_pricing_rules
set config = jsonb_set(config, '{matrix}',
  '[[49.99,69.95,94.99,114.99,129.99],[49.99,69.95,94.99,114.99,129.99],[55,79,105,125,145],[64.99,85,115,135,160],[70,100,130,155,175]]'::jsonb),
    updated_at = now()
where tenant_id = '61205cb9-1418-4bfa-a029-bbb44d4e4310' and rule_type = 'matrix_2d';
