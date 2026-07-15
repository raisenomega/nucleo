-- Migración 161: service_pages (páginas dedicadas de servicio, multi-tenant) + Hydro-Jet 1:1 legacy.
-- Tabla genérica + 2 RPC anon (get page / create request→lead) + seed verbatim + refactor landing_hero (CTA único
-- 'Ver más' → /servicios/hydro-jet) + soft-delete del service Hydro-Jet del catálogo. Add-on $39.99 intacto.

create table if not exists public.tenant_service_pages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  slug text not null,
  is_active boolean not null default true,
  hero jsonb not null default '{}'::jsonb,
  uses jsonb not null default '[]'::jsonb,
  specs jsonb not null default '[]'::jsonb,
  faq jsonb not null default '[]'::jsonb,
  request_form jsonb not null default '{}'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);
alter table public.tenant_service_pages enable row level security;
drop policy if exists tsp_public_read on public.tenant_service_pages;
create policy tsp_public_read on public.tenant_service_pages for select using (is_active = true);
drop policy if exists tsp_ceo_all on public.tenant_service_pages;
create policy tsp_ceo_all on public.tenant_service_pages for all
  using (tenant_id = public.current_tenant() and public.is_ceo_or_above())
  with check (tenant_id = public.current_tenant() and public.is_ceo_or_above());
create index if not exists idx_tsp_active on public.tenant_service_pages (tenant_id, slug) where is_active;

-- RPC: página de servicio por hostname+slug (anon).
create or replace function public._public_get_service_page(_hostname text, _slug text)
returns jsonb language plpgsql stable security definer set search_path to 'public', 'extensions' as $fn$
declare _t uuid; _r jsonb;
begin
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return null; end if;
  select jsonb_build_object('slug',slug,'hero',hero,'uses',uses,'specs',specs,'faq',faq,'request_form',request_form,'seo',seo)
    into _r from public.tenant_service_pages where tenant_id=_t and slug=_slug and is_active limit 1;
  return _r;
end $fn$;
grant execute on function public._public_get_service_page(text, text) to anon, authenticated;

-- RPC: crea un lead desde el form request de la página (anon, rate-limit 5/min por host|email|ip).
create or replace function public._public_create_service_request(_hostname text, _slug text, _payload jsonb, _client_ip text default 'unknown')
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions' as $fn$
declare _t uuid; _ceo uuid; _name text; _email text; _hits int; _lead uuid; _notes text;
begin
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return jsonb_build_object('status','error','code','origin_not_allowed'); end if;
  _name := btrim(concat_ws(' ', _payload->>'firstName', _payload->>'lastName'));
  _email := lower(btrim(coalesce(_payload->>'email','')));
  if _name='' or _email='' or coalesce(_payload->>'phone','')='' or coalesce(_payload->>'serviceType','')='' then
    return jsonb_build_object('status','error','code','invalid_payload'); end if;
  _hits := public._public_rate_hit(encode(extensions.digest(_hostname||'|'||_email||'|'||coalesce(nullif(_client_ip,''),'unknown'),'sha256'),'hex'));
  if _hits > 5 then return jsonb_build_object('status','error','code','rate_limited'); end if;
  select user_id into _ceo from public.user_roles where tenant_id=_t and role in ('ceo','superadmin') order by role limit 1;
  _notes := concat_ws(E'\n', 'Solicitud '||_slug,
    nullif('Tipo: '||coalesce(_payload->>'serviceType',''),'Tipo: '),
    nullif('Área: '||coalesce(_payload->>'approxArea',''),'Área: '),
    nullif('Urgencia: '||coalesce(_payload->>'urgency',''),'Urgencia: '),
    nullif('Superficies: '||coalesce(_payload->>'surfaces',''),'Superficies: '),
    nullif('Descripción: '||coalesce(_payload->>'description',''),'Descripción: '));
  insert into public.leads (tenant_id, contact_name, phone, email, service_requested, lead_source, temperature, status, notes, created_by, attended_by)
    values (_t, _name, _payload->>'phone', _email, nullif(_payload->>'serviceType',''), _slug||'-request', 'warm', 'Nuevo', _notes, _ceo, _ceo)
    returning id into _lead;
  return jsonb_build_object('status','ok','lead_id',_lead);
end $fn$;
grant execute on function public._public_create_service_request(text, text, jsonb, text) to anon, authenticated;

-- Fix: el hero landing ya no debe exigir is_active del service (Hydro-Jet pasa a is_active=false pero su hero sigue).
create or replace function public._public_landing_hero_sections(_hostname text)
returns jsonb language plpgsql stable security definer set search_path to 'public', 'extensions' as $fn$
declare _t uuid; _res jsonb;
begin
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return '[]'::jsonb; end if;
  with items as (
    select 'service' k, id, slug, name, price, landing_hero h, display_order d from public.tenant_landing_services where tenant_id=_t and landing_hero->>'is_enabled'='true'
    union all
    select 'product', id, slug, name, price, landing_hero, display_order from public.tenant_landing_products where tenant_id=_t and landing_hero->>'is_enabled'='true'
    union all
    select 'package', id, slug, name, price, landing_hero, display_order from public.tenant_landing_packages where tenant_id=_t and landing_hero->>'is_enabled'='true'
  )
  select coalesce(jsonb_agg(jsonb_build_object('kind',k,'id',id,'slug',slug,'name',name,'base_price',price,'hero',h,
    'secondary_target',(select jsonb_build_object('id',ts.id,'name',ts.name,'base_price',ts.price)
      from public.tenant_landing_services ts where ts.tenant_id=_t and ts.slug = h->>'cta_secondary_target_service_slug' limit 1)) order by d), '[]'::jsonb)
    into _res from items;
  return _res;
end $fn$;
grant execute on function public._public_landing_hero_sections(text) to anon, authenticated;

-- Seed 1:1 legacy (Zafacones). Idempotente por (tenant, slug).
insert into public.tenant_service_pages (tenant_id, slug, is_active, hero, uses, specs, faq, request_form, seo) values
  ('61205cb9-1418-4bfa-a029-bbb44d4e4310', 'hydro-jet', true, '{"badge_es": "Nuevo equipo · 250°F / 5,500 PSI", "badge_en": "New equipment · 250°F / 5,500 PSI", "title_es": "Hydro-Jetter de Remolque", "title_en": "Trailer-mounted Hydro-Jetter", "subtitle_es": "Unidad de alto rendimiento con calentador de agua hasta 250°F y 5,500 PSI, con un flujo de agua elevado (5.8 GPM) para arrasar con bacterias, moho y sedimentos pesados.", "subtitle_en": "High-performance unit with water heater up to 250°F and 5,500 PSI, with high water flow (5.8 GPM) to wipe out bacteria, mold and heavy sediment.", "image_url": null, "image_alt_es": "Hydro-Jetter de remolque con calentador de agua y manguera de alta presión", "image_alt_en": "Trailer-mounted hydro-jetter with water heater and high-pressure hose"}'::jsonb, '[{"icon": "CheckCircle2", "title_es": "Aceras y caminos", "title_en": "Sidewalks and walkways", "description_es": "Eliminamos manchas de aceite, chicles, hongos y suciedad acumulada en aceras y caminos peatonales.", "description_en": "We remove oil stains, gum, mildew and built-up grime from sidewalks and walkways."}, {"icon": "Building2", "title_es": "Paredes y fachadas", "title_en": "Walls and facades", "description_es": "Restauramos paredes exteriores, fachadas y muros con moho, polvo o suciedad sin dañar el acabado.", "description_en": "We restore exterior walls, facades and fences with mold, dust or grime without damaging the finish."}, {"icon": "Home", "title_es": "Marquesinas y entradas", "title_en": "Carports and driveways", "description_es": "Marquesinas, entradas de hormigón y rampas vuelven a verse como nuevas.", "description_en": "Carports, concrete driveways and ramps look brand new again."}, {"icon": "Sun", "title_es": "Terrazas y patios", "title_en": "Terraces and patios", "description_es": "Limpieza profunda en terrazas, balcones, patios y áreas de piscina.", "description_en": "Deep cleaning for terraces, balconies, patios and pool areas."}, {"icon": "Truck", "title_es": "Estacionamientos", "title_en": "Parking lots", "description_es": "Estacionamientos residenciales y comerciales, eliminando grasa y manchas pegadas.", "description_en": "Residential and commercial parking lots, removing grease and stuck-on stains."}, {"icon": "Store", "title_es": "Áreas comerciales", "title_en": "Commercial areas", "description_es": "Áreas de servicio, dumpsters, cocinas exteriores y zonas de carga con desinfección a 250°F.", "description_en": "Service areas, dumpsters, outdoor kitchens and loading zones with 250°F disinfection."}]'::jsonb, '[{"icon": "Flame", "label_es": "Temperatura", "label_en": "Temperature", "value_es": "Hasta 250°F", "value_en": "Up to 250°F"}, {"icon": "Gauge", "label_es": "Presión", "label_en": "Pressure", "value_es": "5,500 PSI", "value_en": "5,500 PSI"}, {"icon": "Droplets", "label_es": "Caudal", "label_en": "Water flow", "value_es": "5.8 GPM", "value_en": "5.8 GPM"}, {"icon": "Truck", "label_es": "Equipo", "label_en": "Equipment", "value_es": "Remolque autónomo", "value_en": "Self-contained trailer"}]'::jsonb, '[{"category_es": "Básicos", "category_en": "Basic", "question_es": "¿Qué superficies se pueden limpiar con el Hydro-Jetter?", "question_en": "What surfaces can the Hydro-Jetter clean?", "answer_es": "Aceras, paredes, terrazas, parking, áreas comerciales y entradas de vehículos. Cualquier superficie exterior con acumulación de bacterias, moho o sedimentos.", "answer_en": "Sidewalks, walls, terraces, parking, commercial areas and driveways. Any outdoor surface with bacterial buildup, mold or sediment."}, {"category_es": "Básicos", "category_en": "Basic", "question_es": "¿Cuál es la temperatura y presión del equipo?", "question_en": "What''s the equipment temperature and pressure?", "answer_es": "250°F de temperatura y 5,500 PSI de presión, con flujo de 5.8 GPM, montado en remolque para máxima movilidad.", "answer_en": "250°F temperature and 5,500 PSI pressure, with 5.8 GPM flow, trailer-mounted for maximum mobility."}, {"category_es": "Básicos", "category_en": "Basic", "question_es": "¿Pueden combinarlo con otros servicios?", "question_en": "Can it be combined with other services?", "answer_es": "Sí. El Hydro-Jet se puede contratar como servicio independiente o como add-on a una suscripción residencial, comercial o soterrada.", "answer_en": "Yes. Hydro-Jet works as a standalone service or as an add-on to a residential, commercial or in-ground subscription."}, {"category_es": "Básicos", "category_en": "Basic", "question_es": "¿Cuánto tarda un servicio típico?", "question_en": "How long does a typical service take?", "answer_es": "Un área residencial promedio (300-600 ft²) toma entre 45 minutos y 2 horas. Áreas comerciales se cotizan por superficie.", "answer_en": "An average residential area (300-600 sq ft) takes between 45 minutes and 2 hours. Commercial areas are quoted by surface."}, {"category_es": "Avanzados", "category_en": "Advanced", "question_es": "¿Por qué agua caliente a 250°F y no fría?", "question_en": "Why hot water at 250°F instead of cold?", "answer_es": "El agua a 250°F descompone grasa, aceite y biofilm bacteriano que el agua fría solo desplaza. Reduce el uso de químicos hasta un 80% y elimina patógenos por choque térmico, no solo por presión mecánica.", "answer_en": "Water at 250°F breaks down grease, oil and bacterial biofilm that cold water only displaces. It reduces chemical use by up to 80% and kills pathogens by thermal shock, not just mechanical pressure."}, {"category_es": "Avanzados", "category_en": "Advanced", "question_es": "¿Pueden dañar superficies delicadas con 5,500 PSI?", "question_en": "Can 5,500 PSI damage delicate surfaces?", "answer_es": "No. Regulamos la presión y el ángulo de boquilla según superficie: 5,500 PSI para hormigón y dumpsters, 1,500-2,500 PSI para madera, ladrillo o pintura. Hacemos prueba de área antes de empezar.", "answer_en": "No. We adjust pressure and nozzle angle by surface: 5,500 PSI for concrete and dumpsters, 1,500-2,500 PSI for wood, brick or paint. We do a test patch before starting."}, {"category_es": "Avanzados", "category_en": "Advanced", "question_es": "¿Qué químicos o desinfectantes utilizan?", "question_en": "What chemicals or disinfectants do you use?", "answer_es": "Usamos detergentes y desinfectantes biodegradables aprobados por EPA y compatibles con cloruro de benzalconio. En aplicaciones de grado salud (hospitales, food service) usamos químicos específicos certificados NSF.", "answer_en": "Biodegradable EPA-approved detergents and disinfectants, compatible with benzalkonium chloride. For health-grade applications (hospitals, food service) we use NSF-certified specific chemicals."}, {"category_es": "Avanzados", "category_en": "Advanced", "question_es": "¿El equipo cumple normas ambientales para escorrentía?", "question_en": "Does the equipment meet runoff environmental standards?", "answer_es": "Sí. Capturamos y filtramos escorrentía contaminada cuando el área lo requiere (estaciones de servicio, talleres, dumpster pads) para cumplir con regulaciones de la Junta de Calidad Ambiental de PR.", "answer_en": "Yes. We capture and filter contaminated runoff when the area requires it (gas stations, shops, dumpster pads) to comply with PR Environmental Quality Board regulations."}, {"category_es": "Avanzados", "category_en": "Advanced", "question_es": "¿Funciona sobre concreto sellado o pintado sin levantarlo?", "question_en": "Does it work on sealed or painted concrete without lifting it?", "answer_es": "Sí, ajustando presión a 1,500-2,000 PSI y boquilla de 25-40°. El operador certificado evalúa el sellador y la edad de la pintura antes de definir parámetros.", "answer_en": "Yes, by adjusting pressure to 1,500-2,000 PSI and a 25-40° nozzle. The certified operator evaluates the sealer and paint age before setting parameters."}, {"category_es": "Avanzados", "category_en": "Advanced", "question_es": "¿Cuánto consumo de agua tiene una jornada típica?", "question_en": "How much water does a typical session use?", "answer_es": "A 5.8 GPM, una jornada de 4 horas usa aproximadamente 1,400 galones. El remolque es autónomo: trae su propio tanque y bomba, no requiere agua del cliente.", "answer_en": "At 5.8 GPM, a 4-hour session uses about 1,400 gallons. The trailer is self-contained: it brings its own tank and pump, no client water needed."}, {"category_es": "Avanzados", "category_en": "Advanced", "question_es": "¿Tienen seguro de responsabilidad civil?", "question_en": "Do you carry liability insurance?", "answer_es": "Sí. Contamos con cobertura de responsabilidad civil comercial. Podemos enviar certificate of insurance (COI) bajo solicitud para clientes corporativos o property managers.", "answer_en": "Yes. We carry commercial general liability coverage. We can send a certificate of insurance (COI) on request for corporate clients or property managers."}]'::jsonb, '{"title_es": "Solicitar cotización Hydro-Jet", "title_en": "Request Hydro-Jet quote", "submit_label_es": "Enviar solicitud", "submit_label_en": "Send request", "success_title_es": "¡Solicitud enviada!", "success_title_en": "Request sent!", "success_message_es": "Un representante se contactará contigo a la brevedad para mayores detalles.", "success_message_en": "A representative will contact you shortly with more details.", "fields": [{"name": "serviceType", "kind": "select", "label_es": "Tipo de trabajo o servicio", "label_en": "Type of work or service", "required": true, "options": [{"value": "sidewalks", "label_es": "Aceras y caminos", "label_en": "Sidewalks and walkways"}, {"value": "walls", "label_es": "Paredes y fachadas", "label_en": "Walls and facades"}, {"value": "driveways", "label_es": "Marquesinas y entradas", "label_en": "Carports and driveways"}, {"value": "terraces", "label_es": "Terrazas, patios y piscina", "label_en": "Terraces, patios and pool areas"}, {"value": "parking", "label_es": "Estacionamientos", "label_en": "Parking lots"}, {"value": "commercial", "label_es": "Áreas comerciales / dumpster", "label_en": "Commercial / dumpster areas"}, {"value": "other", "label_es": "Otro (describir)", "label_en": "Other (describe)"}]}, {"name": "approxArea", "kind": "select", "label_es": "Área aproximada", "label_en": "Approximate area", "required": false, "options": [{"value": "small", "label_es": "Pequeña (hasta 200 ft²)", "label_en": "Small (up to 200 ft²)"}, {"value": "medium", "label_es": "Mediana (200 - 500 ft²)", "label_en": "Medium (200 - 500 ft²)"}, {"value": "large", "label_es": "Grande (500 - 1,000 ft²)", "label_en": "Large (500 - 1,000 ft²)"}, {"value": "xlarge", "label_es": "Muy grande (más de 1,000 ft²)", "label_en": "Very large (over 1,000 ft²)"}, {"value": "unknown", "label_es": "No estoy seguro/a", "label_en": "Not sure"}]}, {"name": "urgency", "kind": "select", "label_es": "Urgencia / fecha deseada", "label_en": "Urgency / desired date", "required": false, "options": [{"value": "asap", "label_es": "Lo antes posible", "label_en": "As soon as possible"}, {"value": "week", "label_es": "Esta semana", "label_en": "This week"}, {"value": "month", "label_es": "Este mes", "label_en": "This month"}, {"value": "flex", "label_es": "Flexible", "label_en": "Flexible"}]}, {"name": "surfaces", "kind": "multi_select", "label_es": "Tipo(s) de superficie", "label_en": "Surface type(s)", "required": false, "options": [{"value": "concrete", "label_es": "Hormigón", "label_en": "Concrete"}, {"value": "brick", "label_es": "Ladrillo / bloque", "label_en": "Brick / block"}, {"value": "wood", "label_es": "Madera", "label_en": "Wood"}, {"value": "tile", "label_es": "Losa / cerámica", "label_en": "Tile / ceramic"}, {"value": "metal", "label_es": "Metal", "label_en": "Metal"}, {"value": "other", "label_es": "Otra", "label_en": "Other"}]}, {"name": "description", "kind": "textarea", "label_es": "Descripción adicional", "label_en": "Additional description", "required": false, "placeholder_es": "Ej: Necesito limpieza de la entrada y aceras de mi casa con manchas de aceite y moho. Aproximadamente 600 pies cuadrados.", "placeholder_en": "Ex: I need cleaning of my driveway and sidewalks with oil and mold stains. Approx. 600 sq ft."}, {"name": "firstName", "kind": "text", "label_es": "Nombre", "label_en": "First name", "required": true}, {"name": "lastName", "kind": "text", "label_es": "Apellido", "label_en": "Last name", "required": true}, {"name": "phone", "kind": "tel", "label_es": "Teléfono", "label_en": "Phone", "required": true}, {"name": "email", "kind": "email", "label_es": "Correo electrónico", "label_en": "Email", "required": true}]}'::jsonb, '{"meta_title_es": "Hydro-Jet en Puerto Rico · 250°F · 5,500 PSI · Zafacones Ramos", "meta_title_en": "Hydro-Jet in Puerto Rico · 250°F · 5,500 PSI · Zafacones Ramos", "meta_description_es": "Servicio de hydro-jetting en PR con agua caliente 250°F y 5,500 PSI. Limpia grasa, moho y bacterias en aceras, paredes, terrazas y contenedores comerciales.", "meta_description_en": "Hydro-jetting service in PR with 250°F hot water and 5,500 PSI. Cleans grease, mold and bacteria on sidewalks, walls, terraces and commercial containers.", "keywords_es": "hydro jet puerto rico, limpieza a presion pr, hydro jetting comercial, lavado a vapor puerto rico", "keywords_en": "hydro jet puerto rico, pressure washing pr, commercial hydro jetting, steam cleaning puerto rico", "og_image": null, "canonical_path": "/servicios/hydro-jet"}'::jsonb)
  on conflict (tenant_id, slug) do nothing;

-- landing_hero Hydro-Jet: CTA único 'Ver más' → /servicios/hydro-jet (deprecar cta_primary/secondary de #97).
update public.tenant_landing_services set landing_hero = (landing_hero
  - 'cta_primary_label_es' - 'cta_primary_label_en' - 'cta_secondary_label_es' - 'cta_secondary_label_en' - 'cta_secondary_target_service_slug')
  || '{"link_target_slug":"hydro-jet","link_label_es":"Ver más","link_label_en":"View more"}'::jsonb
  where tenant_id='61205cb9-1418-4bfa-a029-bbb44d4e4310' and slug='hydro-jet';

-- Soft-delete del service Hydro-Jet del catálogo (preserva el row + landing_hero; hero landing ya no exige is_active).
update public.tenant_landing_services set is_active=false where tenant_id='61205cb9-1418-4bfa-a029-bbb44d4e4310' and slug='hydro-jet';
