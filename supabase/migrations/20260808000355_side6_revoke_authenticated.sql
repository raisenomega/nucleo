-- SIDE-6 (a) · Cierre de la superficie `authenticated`.
-- Origen: auditoría E2E 2026-08-01 + Fase 1B con 5 criterios sobre las 420 funciones alcanzables por
-- authenticated (no las 111 del inventario inicial: ese subconjunto era arbitrario).
--
-- POR QUÉ ESTE ARCO: SIDE-1→5 cerraron la superficie ANON con rigor. La superficie AUTHENTICATED nunca se
-- auditó, y es más grande. Peor: TODAS las revocaciones de las migr 349/350/351/352 se escribieron como
-- `from public, anon` y dejaron `authenticated` intacto, así que la vulnerabilidad CRITICAL de SIDE-2
-- —disparar correos no autorizados a clientes reales y quemar acceptance_email_sent_at— seguía abierta
-- para cualquier cuenta con login. El ataque es idéntico: `_public_create_order` es anon y devuelve el
-- order_id con el email que el atacante elija.
--
-- QUÉ NO SE TOCA (Grupo D, 26 funciones): 6 helpers usados dentro de policies RLS —current_tenant en 142
-- tablas, is_ceo_or_above en 64, can_access_module en 45, is_superadmin en 33, is_coo_or_above en 13,
-- is_operaciones_or_above en 5— y 20 trabajos de pg_cron. Revocar los primeros haría que esas tablas
-- devolvieran 42501 a todo usuario logueado: el panel caído para los 12 tenants. Es exactamente el fallo
-- que provocó la migr 309 y que hubo que reparar con la 318.
--
-- MÉTODO: una función sólo entra aquí si los CINCO criterios dan cero — policies, cuerpo de otras
-- funciones, triggers, crons y frontend/edge. El criterio de las llamadas usa el patrón `nombre(` y no
-- `nombre` a secas, porque hay columnas homónimas de funciones (is_demo_tenant, clock_in, clock_out,
-- record_stop_payment) que inflaban el conteo de llamadores y habrían dejado funciones sin revocar.
--
-- Los grants de postgres y del rol de servidor NO se tocan: los llamadores legítimos son triggers, crons
-- y funciones DEFINER que corren como postgres, y para ellos el privilegio se evalúa como postgres.

-- ---------------------------------------------------------------------------------------------------
-- GRUPO B (23) · Cero llamadores en los cinco criterios.
-- ---------------------------------------------------------------------------------------------------
revoke execute on function public._ensure_partition_exists(_table_name text, _date date) from public, anon, authenticated;
revoke execute on function public._issue_signed_contract(_order_id uuid, _locale text, _terms text, _summary text, _signer_name text, _signer_email text, _ip text, _ua text) from public, anon, authenticated;
revoke execute on function public._log_guardian_event(p_event_type text, p_severity text, p_metadata jsonb) from public, anon, authenticated;
revoke execute on function public.alert_default_partition_count() from public, anon, authenticated;
revoke execute on function public.backfill_orders_customers() from public, anon, authenticated;
revoke execute on function public.backfill_quotes_invoices_customers() from public, anon, authenticated;
revoke execute on function public.calculate_order_total(_items jsonb, _tenant uuid, _coupon_code text) from public, anon, authenticated;
revoke execute on function public.copy_budget_year(p_from_year integer, p_to_year integer, p_multiplier numeric) from public, anon, authenticated;
revoke execute on function public.create_delivery_note_direct(p_customer_id uuid, p_items jsonb, p_shipping_notes text) from public, anon, authenticated;
revoke execute on function public.create_trial_tenant(name text, email text, business_name text, phone text) from public, anon, authenticated;
revoke execute on function public.get_applicant_pipeline(p_opening_id uuid) from public, anon, authenticated;
revoke execute on function public.get_budget_vs_actual(p_tenant_id uuid, p_fiscal_year integer) from public, anon, authenticated;
revoke execute on function public.get_month_reconciliation_status(_year integer, _month integer) from public, anon, authenticated;
revoke execute on function public.get_payroll_summary(p_month date) from public, anon, authenticated;
revoke execute on function public.get_supplier_ap(p_supplier_id uuid) from public, anon, authenticated;
revoke execute on function public.is_demo_tenant() from public, anon, authenticated;
revoke execute on function public.post_asset_depreciation(_year integer, _month integer) from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
revoke execute on function public.seed_pr_fiscal_preset(tid uuid) from public, anon, authenticated;
revoke execute on function public.set_demo_owner_pin(p_tenant_id uuid, p_pin text) from public, anon, authenticated;
revoke execute on function public.set_my_pin(new_pin text) from public, anon, authenticated;
revoke execute on function public.track_ai_crawl(_payload jsonb) from public, anon, authenticated;
revoke execute on function public.upsert_budget_line(p_account_id uuid, p_fiscal_year integer, p_month integer, p_amount numeric, p_notes text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------------
-- GRUPO C (75) · Sólo las invocan otras funciones DEFINER (que corren como postgres), o tocan
-- Vault/HTTP/escriben. El revoke ya cierra la puerta; los guards internos van en la migración 355b.
-- ---------------------------------------------------------------------------------------------------
revoke execute on function public._add_warehouse_reserved(_tenant uuid, _item uuid, _wh uuid, _delta numeric) from public, anon, authenticated;
revoke execute on function public._appointment_email_ctx(p_id uuid) from public, anon, authenticated;
revoke execute on function public._appointment_email_html(_ctx jsonb, p_kind text, p_prev timestamp with time zone) from public, anon, authenticated;
revoke execute on function public._assert_customer_in_tenant(_customer uuid, _tenant uuid) from public, anon, authenticated;
revoke execute on function public._attach_employee_from_applicant(_pid uuid, _aid uuid) from public, anon, authenticated;
revoke execute on function public._billing_frequency_to_interval(_freq text) from public, anon, authenticated;
revoke execute on function public._business_days(_start date, _end date) from public, anon, authenticated;
revoke execute on function public._campaign_can_manage(_tenant uuid) from public, anon, authenticated;
revoke execute on function public._campaign_confirm_email(_page campaign_pages, _to text, _name text) from public, anon, authenticated;
revoke execute on function public._check_screening_complete(p_applicant_id uuid) from public, anon, authenticated;
revoke execute on function public._classify_ai_bot(_ua text) from public, anon, authenticated;
revoke execute on function public._classify_ai_referrer(_ref text) from public, anon, authenticated;
revoke execute on function public._create_onboarding_checklist(p_employee uuid, p_template uuid, p_applicant uuid) from public, anon, authenticated;
revoke execute on function public._customer_appointment(_id uuid) from public, anon, authenticated;
revoke execute on function public._customer_order(_order_id uuid) from public, anon, authenticated;
revoke execute on function public._deduct_item_stock(p_tenant uuid, p_item_id uuid, p_warehouse uuid, p_qty numeric, p_mtype text, p_note text) from public, anon, authenticated;
revoke execute on function public._default_warehouse(_tenant uuid) from public, anon, authenticated;
revoke execute on function public._demo_is_owner() from public, anon, authenticated;
revoke execute on function public._detect_video_provider(p_url text) from public, anon, authenticated;
revoke execute on function public._email_base(_e text) from public, anon, authenticated;
revoke execute on function public._email_superadmins(p_subject text, p_body_html text) from public, anon, authenticated;
revoke execute on function public._ensure_leave_balance(_tenant uuid, _emp uuid, _type uuid, _year integer) from public, anon, authenticated;
revoke execute on function public._field_pricing_rule(_tenant uuid, _form_id uuid, _field_key text) from public, anon, authenticated;
revoke execute on function public._fmt_dt_es(ts timestamp with time zone, tz text) from public, anon, authenticated;
revoke execute on function public._fmt_price(_p numeric) from public, anon, authenticated;
revoke execute on function public._haversine_meters(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric) from public, anon, authenticated;
revoke execute on function public._html_escape(_input text) from public, anon, authenticated;
revoke execute on function public._insert_so_items(p_so uuid, p_tenant uuid, p_items jsonb) from public, anon, authenticated;
revoke execute on function public._is_month_closed(p_tenant uuid, p_date date) from public, anon, authenticated;
revoke execute on function public._landing_resolve_tenant(_hostname text) from public, anon, authenticated;
revoke execute on function public._landing_rl(_key text, _limit integer) from public, anon, authenticated;
revoke execute on function public._marketing_email_html(_heading text, _body_html text) from public, anon, authenticated;
revoke execute on function public._month_totals(p_tenant uuid, p_year integer, p_month integer) from public, anon, authenticated;
revoke execute on function public._monthly_depreciation(_asset tenant_assets) from public, anon, authenticated;
revoke execute on function public._next_delivery_note_number(p_tenant_id uuid) from public, anon, authenticated;
revoke execute on function public._next_journal_number(p_tenant_id uuid) from public, anon, authenticated;
revoke execute on function public._next_sales_order_number(p_tenant_id uuid) from public, anon, authenticated;
revoke execute on function public._next_vendor_bill_number(p_tenant_id uuid) from public, anon, authenticated;
revoke execute on function public._notify_lead_created(_lead_id uuid) from public, anon, authenticated;
revoke execute on function public._notify_order_awaiting_confirmation(_order_id uuid) from public, anon, authenticated;
revoke execute on function public._notify_sales(_tenant uuid, _kind text, _title text, _body text, _entity uuid, _entity_type text) from public, anon, authenticated;
revoke execute on function public._notify_subscription_cycle_due(_order_id uuid) from public, anon, authenticated;
revoke execute on function public._notify_superadmins(_kind text, _title text, _body text, _entity_type text, _entity_id uuid) from public, anon, authenticated;
revoke execute on function public._notify_tenant_owner(_tenant uuid, _kind text, _title text, _body text, _entity uuid, _subject text, _html text, _entity_type text) from public, anon, authenticated;
revoke execute on function public._notify_user(_tenant uuid, _user_id uuid, _kind text, _title text, _body text, _entity_type text, _entity_id uuid) from public, anon, authenticated;
revoke execute on function public._payment_terms_days(_terms text, _custom_days integer) from public, anon, authenticated;
revoke execute on function public._point_in_polygon(p_lat numeric, p_lng numeric, p_poly jsonb) from public, anon, authenticated;
revoke execute on function public._post_depreciation_for(_tenant uuid, _year integer, _month integer, _asset_id uuid) from public, anon, authenticated;
revoke execute on function public._rate_hit_ip(_key text, _window_secs integer) from public, anon, authenticated;
revoke execute on function public._recalc_item_reserved(p_item_id uuid) from public, anon, authenticated;
revoke execute on function public._recruit_maybe_fill(p_opening uuid) from public, anon, authenticated;
revoke execute on function public._recruit_next_opening_number(p_tenant uuid) from public, anon, authenticated;
revoke execute on function public._recruit_slug(p_title text) from public, anon, authenticated;
revoke execute on function public._refresh_so_status(p_so uuid) from public, anon, authenticated;
revoke execute on function public._resolve_customer_by_email(_tenant uuid, _email text, _name text, _phone text, _source text) from public, anon, authenticated;
revoke execute on function public._resolve_customer_for_lead(_tenant uuid, _email text, _phone text) from public, anon, authenticated;
revoke execute on function public._seed_leave_types(_t uuid) from public, anon, authenticated;
revoke execute on function public._seed_onboarding_template(_t uuid) from public, anon, authenticated;
revoke execute on function public._send_subscription_acceptance_email(_order_id uuid) from public, anon, authenticated;
revoke execute on function public._sentinel_alert(_type text, _severity text, _title text, _body text, _meta jsonb) from public, anon, authenticated;
revoke execute on function public._tenant_site(_t uuid) from public, anon, authenticated;
revoke execute on function public._urlencode(_s text) from public, anon, authenticated;
revoke execute on function public._void_reason(p_reason text) from public, anon, authenticated;
revoke execute on function public._watchlist_upsert(_ip text, _type text, _reason text, _exp timestamp with time zone) from public, anon, authenticated;
revoke execute on function public.channel_for_source(p_source text) from public, anon, authenticated;
revoke execute on function public.check_geofence_violations(p_asset_id uuid, p_lat numeric, p_lng numeric) from public, anon, authenticated;
revoke execute on function public.create_contract_token(OUT token text, OUT token_hash text) from public, anon, authenticated;
revoke execute on function public.expense_breakdown_for(tid uuid, m0 date, m1 date) from public, anon, authenticated;
revoke execute on function public.expense_classes_for(tid uuid, m0 date, m1 date) from public, anon, authenticated;
revoke execute on function public.monthly_series_for(tid uuid, yr integer, pct numeric) from public, anon, authenticated;
revoke execute on function public.next_order_number(_tenant uuid, _kind text) from public, anon, authenticated;
revoke execute on function public.report_series_cuts(_tid uuid, _from date, _to date) from public, anon, authenticated;
revoke execute on function public.report_series_months(_tid uuid, _from date, _to date) from public, anon, authenticated;
revoke execute on function public.tax_obligations_for(tid uuid, m0 date, m1 date) from public, anon, authenticated;
revoke execute on function public.validate_order_form_data(_form_id uuid, _data jsonb) from public, anon, authenticated;

insert into public.audit_log (tenant_id, action, entity_type, new_values, risk_level)
values (null, 'side6_authenticated_hardening', 'security',
  jsonb_build_object(
    'grupo_b_revoked', 23, 'grupo_c_revoked', 75, 'total_revoked', 98,
    'grupo_d_intocable', 26,
    'retroactivo_side2', jsonb_build_array('_send_subscription_acceptance_email','_issue_signed_contract',
                                           'create_contract_token','_rate_hit_ip'),
    'nota', 'las migr 349/350/351/352 revocaron solo public+anon; authenticated seguia abierto',
    'pendiente', 'migr 355b: guards current_user en las 4 que tocan vault/http',
    'migration', '20260808000355'),
  'critical');
