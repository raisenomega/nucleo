-- SIDE-7 (c) · Hacer que `revoked_at` SEA de verdad el control de vida útil de los enlaces públicos.
--
-- ORIGEN: la migr 358 línea 25 declara «El control de vida útil aquí es `revoked_at`, no el reloj», en
-- presente, como si el control estuviera en vigor. No lo estaba: 358 creó las columnas y los índices
-- parciales `where revoked_at is null`, pero NINGUNA lectura consultaba la columna. Poner
-- `revoked_at = now()` no revocaba nada. La 359 que iba a cerrarlo nunca se escribió (el directorio
-- saltaba de 358 a 360), así que la frase llevaba tres migraciones siendo falsa.
--
-- POR QUE ESTO ES SEGURO Y NO ES LA 359 "GRANDE": la deuda original (docs-nucleo/DEUDA-SIDE7-MIGR-359.md)
-- empaquetaba DOS cambios y los hacía rehenes uno del otro. El riesgo NO está repartido por igual:
--   (a) cambiar el lookup a `token_hash = _hash`  -> SÍ es peligroso. Cambia la CLAVE de búsqueda; si
--       falla, la orden existe pero no se puede cobrar y el cliente ve un error genérico de pago.
--       Exige owner delante y un cobro real validado en Stripe test mode. NO SE HACE AQUI.
--   (b) añadir `and revoked_at is null`            -> es un no-op demostrable. NO cambia la clave de
--       búsqueda: sólo añade un predicado que hoy es verdadero para el 100% de las filas, porque 358
--       creó la columna sin default y nadie la escribe (`grep -rn revoked_at apps/ supabase/ services/`
--       sólo devuelve la migr 351 —otra tabla, tenant_signed_contracts— y la propia 358).
-- Esta migración aplica SÓLO (b). Mismo plan de ejecución que el resto de las lecturas públicas.
--
-- LO QUE NO ENTRA, Y POR QUE (gap residual, leer antes de tocar el panel):
--   · create_stripe_checkout_session      (última def: migr 346:15)
--   · create_stripe_subscription_checkout (última def: migr 340:9)
--   El predicado sería igual de inocuo en ellas, pero reescribir su cuerpo entero a mano —son las dos
--   funciones del camino del dinero— tiene un riesgo de TRANSCRIPCION que no compensa en un cambio
--   mecánico. Van en la sesión con el owner, donde ya hay que abrirlas para (a). Son dos líneas.
--   CONSECUENCIA MIENTRAS TANTO: una factura con `revoked_at` puesto deja de VERSE pero todavía se puede
--   PAGAR por RPC directa. Por eso NO se debe exponer aún un botón "revocar enlace" en el panel.
--
-- SOBRE LOS GRANTS: no se toca ni uno. `create or replace` con la MISMA firma preserva propietario y
-- permisos (PostgreSQL). Re-otorgar sería el error clásico que vigila grants-coverage.test.ts: volvería a
-- abrir el bit PUBLIC que la migr 349:35 cerró en `public_invoice_pay_options`.
--
-- CUERPOS: cada función se reemplaza con su definición VIGENTE (la más reciente), no con la original.
-- Ojo con `get_public_order`: su última definición es la de la migr 338:8 (en MAYUSCULAS), que añadió
-- `offer_id` + `off.hook_price as offer_hook`. Partir de la 305 habría revertido esa feature en silencio.

-- 1) Orden pública. Cuerpo vigente = migr 338:8. Única línea nueva: el predicado en el where.
CREATE OR REPLACE FUNCTION public.get_public_order(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare _o record; _hash text;
begin
  _hash := encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');
  if public._public_rate_hit(_hash) > 30 then return jsonb_build_object('status', 'rate_limited'); end if;
  select o.order_number, o.customer_name, o.customer_phone, o.customer_email, o.customer_address, o.items,
         o.subtotal, o.tax, o.shipping, o.discount, o.total, o.status, o.created_at, o.billing_frequency,
         o.source_hostname, o.custom_fields, o.offer_id, off.hook_price as offer_hook, t.display_name, t.legal_name, t.contact_phone,
         th.primary_color, th.accent_color, th.logo_url
    into _o from public.tenant_landing_orders o
    join public.tenants t on t.id = o.tenant_id
    left join public.tenant_landing_offers off on off.id = o.offer_id
    left join public.tenant_themes th on th.tenant_id = o.tenant_id
    where o.public_token = p_token and o.revoked_at is null;
  if not found then return jsonb_build_object('status', 'not_found'); end if;
  return jsonb_build_object('status', 'valid',
    'order', jsonb_build_object('order_number', _o.order_number, 'customer_name', _o.customer_name, 'phone', _o.customer_phone,
      'email', _o.customer_email, 'address', _o.customer_address, 'items', _o.items, 'subtotal', _o.subtotal, 'tax', _o.tax,
      'shipping', _o.shipping, 'discount', _o.discount, 'total', _o.total, 'status', _o.status, 'created_at', _o.created_at,
      'billing_frequency', _o.billing_frequency, 'source', _o.source_hostname, 'custom_fields', _o.custom_fields,
      'offer_hook', _o.offer_hook),
    'tenant', jsonb_build_object('display_name', _o.display_name, 'legal_name', _o.legal_name, 'contact_phone', _o.contact_phone,
      'primary_color', coalesce(_o.primary_color, '#1a1a2e'), 'accent_color', coalesce(_o.accent_color, '#4a4a6a'), 'logo_url', _o.logo_url));
end $function$;

-- 2) Estado de cuenta público. Cuerpo vigente = migr 305:64.
create or replace function public.get_public_customer_statement(p_token text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare _c record; _hash text; _due numeric; _invs jsonb; _pays jsonb;
begin
  _hash := encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');
  if public._public_rate_hit(_hash) > 30 then return jsonb_build_object('status', 'rate_limited'); end if;
  select cp.id, cp.tenant_id, cp.full_name, t.display_name, t.legal_name, t.contact_phone,
         th.primary_color, th.accent_color, th.logo_url
    into _c from public.customer_profiles cp
    join public.tenants t on t.id = cp.tenant_id
    left join public.tenant_themes th on th.tenant_id = cp.tenant_id
    where cp.public_token = p_token and cp.revoked_at is null;
  if not found then return jsonb_build_object('status', 'not_found'); end if;
  select coalesce(sum(balance), 0), coalesce(jsonb_agg(jsonb_build_object('invoice_number', invoice_number, 'total', total,
    'balance', balance, 'due_date', due_date, 'days_overdue', greatest(0, current_date - due_date)) order by due_date), '[]'::jsonb)
    into _due, _invs from public.invoices where customer_id = _c.id and tenant_id = _c.tenant_id and status not in ('paid', 'cancelled');
  select coalesce(jsonb_agg(jsonb_build_object('date', ip.payment_date, 'amount', ip.amount, 'invoice_number', i.invoice_number) order by ip.payment_date desc), '[]'::jsonb)
    into _pays from public.invoice_payments ip join public.invoices i on i.id = ip.invoice_id
    where i.customer_id = _c.id and i.tenant_id = _c.tenant_id;
  return jsonb_build_object('status', 'valid', 'customer_name', _c.full_name, 'total_due', _due, 'invoices', _invs, 'payments', _pays,
    'tenant', jsonb_build_object('display_name', _c.display_name, 'legal_name', _c.legal_name, 'contact_phone', _c.contact_phone,
      'primary_color', coalesce(_c.primary_color, '#1a1a2e'), 'accent_color', coalesce(_c.accent_color, '#4a4a6a'), 'logo_url', _c.logo_url));
end $$;

-- 3) Factura pública. Cuerpo vigente = migr 304:23.
create or replace function public.get_public_invoice(p_token text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare _q record; _hash text;
begin
  _hash := encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');
  if public._public_rate_hit(_hash) > 30 then return jsonb_build_object('status', 'rate_limited'); end if;
  select i.invoice_number, i.client_name, i.phone, i.email, i.items, i.subtotal, i.tax, i.total, i.status, i.due_date, i.created_at, i.pdf_url,
         t.display_name, t.legal_name, t.contact_phone, th.primary_color, th.accent_color, th.logo_url
    into _q from public.invoices i
    join public.tenants t on t.id = i.tenant_id
    left join public.tenant_themes th on th.tenant_id = i.tenant_id
    where i.public_token = p_token and i.revoked_at is null;
  if not found then return jsonb_build_object('status', 'not_found'); end if;
  return jsonb_build_object('status', 'valid',
    'invoice', jsonb_build_object('invoice_number', _q.invoice_number, 'client_name', _q.client_name, 'phone', _q.phone, 'email', _q.email,
      'items', _q.items, 'subtotal', _q.subtotal, 'tax', _q.tax, 'total', _q.total, 'status', _q.status, 'due_date', _q.due_date, 'created_at', _q.created_at),
    'tenant', jsonb_build_object('display_name', _q.display_name, 'legal_name', _q.legal_name, 'contact_phone', _q.contact_phone,
      'primary_color', coalesce(_q.primary_color, '#1a1a2e'), 'accent_color', coalesce(_q.accent_color, '#4a4a6a'), 'logo_url', _q.logo_url),
    'pdf_url', _q.pdf_url);
end $$;

-- 4) Albarán público. Cuerpo vigente = migr 308:13.
create or replace function public.get_public_delivery_note(p_token text)
 returns jsonb language plpgsql security definer set search_path to 'public', 'extensions'
as $function$
declare _d record; _hash text; _items jsonb; _id uuid;
begin
  _hash := encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');
  if public._public_rate_hit(_hash) > 30 then return jsonb_build_object('status', 'rate_limited'); end if;
  select dn.id, dn.note_number, dn.status, dn.dispatch_date, dn.delivery_date, dn.shipping_address, dn.shipping_notes,
         dn.received_by, dn.signature_data, dn.created_at, so.order_number as so_number, cp.full_name as customer_name,
         t.display_name, t.legal_name, t.contact_phone, th.primary_color, th.accent_color, th.logo_url
    into _d from public.delivery_notes dn
    join public.tenants t on t.id = dn.tenant_id
    left join public.sales_orders so on so.id = dn.sales_order_id
    left join public.customer_profiles cp on cp.id = dn.customer_id
    left join public.tenant_themes th on th.tenant_id = dn.tenant_id
    where dn.public_token = p_token and dn.revoked_at is null;
  if not found then return jsonb_build_object('status', 'not_found'); end if;
  select coalesce(jsonb_agg(jsonb_build_object('description', di.description, 'qty', di.qty_dispatched) order by di.line_order), '[]'::jsonb)
    into _items from public.delivery_note_items di where di.delivery_note_id = _d.id;
  return jsonb_build_object('status', 'valid',
    'note', jsonb_build_object('note_number', _d.note_number, 'status', _d.status, 'dispatch_date', _d.dispatch_date,
      'delivery_date', _d.delivery_date, 'shipping_address', _d.shipping_address, 'shipping_notes', _d.shipping_notes,
      'received_by', _d.received_by, 'signature', _d.signature_data, 'so_number', _d.so_number, 'customer_name', _d.customer_name, 'items', _items),
    'tenant', jsonb_build_object('display_name', _d.display_name, 'legal_name', _d.legal_name, 'contact_phone', _d.contact_phone,
      'primary_color', coalesce(_d.primary_color, '#1a1a2e'), 'accent_color', coalesce(_d.accent_color, '#4a4a6a'), 'logo_url', _d.logo_url));
end $function$;

-- 5) Vacante pública. Cuerpo vigente = migr 297:259. Ya tenía control de vida útil propio
--    (status='published' + closes_at); `revoked_at` se suma a ellos, no los sustituye.
create or replace function public.get_public_opening(p_token text)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select jsonb_build_object(
    'opening_id', o.id, 'title', p.title, 'department', p.department, 'description', p.description,
    'responsibilities', p.responsibilities, 'employment_type', p.employment_type, 'schedule', p.schedule,
    'location', p.location, 'is_remote', p.is_remote, 'salary_type', p.salary_type,
    'salary_min', p.salary_min, 'salary_max', p.salary_max, 'currency', p.currency,
    'requirements', p.requirements, 'skills', p.skills, 'custom_questions', o.custom_questions,
    'closes_at', o.closes_at)
  from public.job_openings o join public.job_positions p on p.id = o.position_id
  where o.public_token = p_token and o.revoked_at is null
    and o.status = 'published' and (o.closes_at is null or o.closes_at > now());
$$;

-- 6) Métodos de pago de la factura pública. Cuerpo vigente = migr 317:62 (ACL ajustada en 349, intacta).
--    Con esto, una factura revocada deja de ofrecer Stripe en la página. El cobro por RPC directa sigue
--    abierto hasta que entren las dos del grupo 2 — ver la cabecera.
create or replace function public.public_invoice_pay_options(p_token text)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $fn$
declare _tid uuid; _bal numeric; _en boolean; _pk text;
begin
  select tenant_id, coalesce(balance,total) into _tid, _bal from public.invoices
    where public_token=p_token and revoked_at is null;
  if _tid is null then return jsonb_build_object('stripeEnabled', false); end if;
  select stripe_enabled, stripe_publishable_key into _en, _pk from public.tenant_payment_config where tenant_id=_tid;
  return jsonb_build_object('stripeEnabled', coalesce(_en,false), 'balance', _bal, 'publishableKey', _pk);
end $fn$;

insert into public.audit_log (tenant_id, action, entity_type, new_values, risk_level)
values (null, 'side7_359_revoked_at_enforcement', 'security',
  jsonb_build_object(
    'funciones_con_guard', jsonb_build_array('get_public_order','get_public_customer_statement',
      'get_public_invoice','get_public_delivery_note','get_public_opening','public_invoice_pay_options'),
    'cambio', 'and <tabla>.revoked_at is null en el where. La clave de busqueda sigue siendo public_token',
    'lookup_por_hash', 'NO: sigue pendiente, es el cambio (a) de la deuda y necesita owner + Stripe test mode',
    'no_op_esperado', 'revoked_at es NULL en el 100% de las filas: cero filas cambian de resultado',
    'grants_tocados', 0,
    'gap_residual', 'create_stripe_checkout_session y create_stripe_subscription_checkout siguen sin filtrar',
    'no_habilitar_todavia', 'boton revocar enlace en el panel: esperar al grupo 2',
    'cierra', 'contradiccion declarada en migr 358 linea 25',
    'migration', '20260808000359'),
  'medium');
