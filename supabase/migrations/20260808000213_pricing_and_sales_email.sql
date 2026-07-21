-- 213 · Precios comerciales vigentes + email de ventas.
--
-- Estado previo (4 filas, 3 activas) y por qué NO se puede usar `where name_es = 'Enterprise'`:
--   b19b6693  Enterprise  $14,995  one_time  activa, recomendada   <- la buena
--   64612714  Starter     $49      month     INACTIVA               <- ya oculta
--   81468990  Pro         $549     month     activa
--   df92770b  Enterprise  $749     month     activa                 <- DUPLICADA, sobra
-- Hay DOS filas con name_es='Enterprise', así que filtrar por nombre pisaría ambas y dejaría dos tiers
-- idénticos de $14,995 en la landing. Se actualiza por id.
--
-- Estado final: 2 tiers activos — Pro $749/mes (recomendado) y Enterprise $14,995 pago único.

-- Pro: $549 -> $749/mes y pasa a ser el plan recomendado.
update public.marketing_pricing_tiers
   set price = 749, billing_period = 'month', is_recommended = true, is_active = true, display_order = 1
 where id = '81468990-0158-4ced-a076-45558b83b04e';

-- Enterprise real ($14,995 pago único): deja de ser "recomendado" (ese sello pasa a Pro) y recupera tagline.
update public.marketing_pricing_tiers
   set price = 14995, billing_period = 'one_time', is_recommended = false, is_active = true, display_order = 2,
       name_en = 'Enterprise',
       tagline_es = 'Máximo poder y soporte dedicado',
       tagline_en = 'Maximum power and dedicated support'
 where id = 'b19b6693-069c-4ec2-849e-3c3dc767bc77';

-- Enterprise duplicado de $749/mes: se retira (su precio es el que ahora lleva Pro).
update public.marketing_pricing_tiers set is_active = false
 where id = 'df92770b-4102-4385-89b8-e3f8bb861853';

-- Starter: descontinuado. Ya estaba inactivo; se fuerza por idempotencia.
update public.marketing_pricing_tiers set is_active = false
 where id = '64612714-ef11-40ee-8fd6-9be4c919807a';

-- Email comercial de contacto (footer de la landing + JSON-LD/llms.txt usan ventas@).
update public.marketing_footer set contact_email = 'ventas@raisen.agency';
