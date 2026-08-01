-- SIDE-7 (b, parte aditiva) · Preparar el terreno para tokens hasheados. NADA de comportamiento cambia.
--
-- ORIGEN: hallazgo §17 de la auditoría E2E 2026-08-01. Cinco rutas públicas emiten su token con
-- `default (gen_random_uuid())::text`, lo guardan EN CLARO en la propia tabla del documento, y no tienen
-- ni caducidad ni revocación. El patrón bueno ya existe en este proyecto y está en producción:
-- create_quote_approval_token usa gen_random_bytes(24), persiste sólo el sha256, y tiene expires_at y
-- revocación (lo usa /aprobar/$token).
--
-- POR QUE ESTA MIGRACION ES SOLO ADITIVA: la verificación cruzada de llamadores encontró que NO son 5 las
-- funciones que leen `public_token`, sino NUEVE. Cuatro no estaban en el alcance inicial y dos de ellas son
-- el camino del dinero:
--   · create_stripe_checkout_session        -> `where public_token = p_invoice_token` / `= p_order_token`
--   · create_stripe_subscription_checkout   -> `where public_token = p_order_token` (x2)
--   · public_invoice_pay_options            -> `where public_token = p_token`
--   · _public_create_order                  -> DEVUELVE public_token al frontend tras crear la orden
--   · get_{order,invoice,delivery,customer}_share_url -> LEEN el token en claro para construir la URL
-- Cambiar sólo las RPC de lectura habría dejado la pagina /orden/$token funcionando pero el boton de pagar
-- sin encontrar la orden. Por eso el cambio de lookup se separa a la migración 359, que se aplica con el
-- owner delante y un checkout real validado en Stripe test mode, igual que el arco OFERTAS-HOOK-STRIPE.
--
-- ESTADO TRAS ESTA MIGRACION: columnas e índices listos y hashes calculados, pero las nueve funciones
-- siguen leyendo `public_token` tal cual. Comportamiento IDENTICO al de antes. Cero riesgo.
--
-- expires_at se crea pero se deja en NULL a propósito: una factura o un estado de cuenta son documentos que
-- el cliente puede querer consultar años después. El control de vida útil aquí es `revoked_at`, no el reloj.

alter table public.tenant_landing_orders add column if not exists token_hash text,
  add column if not exists expires_at timestamptz, add column if not exists revoked_at timestamptz;
alter table public.invoices add column if not exists token_hash text,
  add column if not exists expires_at timestamptz, add column if not exists revoked_at timestamptz;
alter table public.delivery_notes add column if not exists token_hash text,
  add column if not exists expires_at timestamptz, add column if not exists revoked_at timestamptz;
alter table public.customer_profiles add column if not exists token_hash text,
  add column if not exists expires_at timestamptz, add column if not exists revoked_at timestamptz;
alter table public.job_openings add column if not exists token_hash text,
  add column if not exists expires_at timestamptz, add column if not exists revoked_at timestamptz;

-- Índice parcial: sólo interesan los tokens vivos, que es como buscará la 359.
create index if not exists idx_tlo_token_hash on public.tenant_landing_orders (token_hash) where revoked_at is null;
create index if not exists idx_invoices_token_hash on public.invoices (token_hash) where revoked_at is null;
create index if not exists idx_delivery_notes_token_hash on public.delivery_notes (token_hash) where revoked_at is null;
create index if not exists idx_customer_profiles_token_hash on public.customer_profiles (token_hash) where revoked_at is null;
create index if not exists idx_job_openings_token_hash on public.job_openings (token_hash) where revoked_at is null;

-- Backfill idempotente. El hash del uuid viejo ES la ruta de compatibilidad: cuando la 359 cambie el
-- lookup, el cliente seguirá mandando el uuid en claro que tiene en su enlace, el servidor lo hasheará y
-- encontrará la fila. Por eso no hace falta un fallback dual.
update public.tenant_landing_orders set token_hash = encode(extensions.digest(public_token,'sha256'),'hex')
 where public_token is not null and token_hash is null;
update public.invoices set token_hash = encode(extensions.digest(public_token,'sha256'),'hex')
 where public_token is not null and token_hash is null;
update public.delivery_notes set token_hash = encode(extensions.digest(public_token,'sha256'),'hex')
 where public_token is not null and token_hash is null;
update public.customer_profiles set token_hash = encode(extensions.digest(public_token,'sha256'),'hex')
 where public_token is not null and token_hash is null;
update public.job_openings set token_hash = encode(extensions.digest(public_token,'sha256'),'hex')
 where public_token is not null and token_hash is null;

insert into public.audit_log (tenant_id, action, entity_type, new_values, risk_level)
values (null, 'side7_358_additive_migration', 'security',
  jsonb_build_object(
    'tablas', jsonb_build_array('tenant_landing_orders','invoices','delivery_notes','customer_profiles','job_openings'),
    'columnas', 'token_hash + expires_at (NULL a proposito) + revoked_at',
    'backfill_esperado', jsonb_build_object('tenant_landing_orders',34,'customer_profiles',41,'invoices',23,
                                            'delivery_notes',5,'job_openings',1),
    'rpcs_modificadas', 0,
    'nota', 'aditiva pura: las 9 funciones que leen public_token siguen intactas',
    'pendiente', 'migr 359: 9 RPCs a lookup por hash, con owner presente y checkout validado en Stripe test mode',
    'migration', '20260808000358'),
  'low');
