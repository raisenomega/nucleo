-- =============================================
-- LANDING PAGES DE CAMPAÑA — R6: pulido (email confirmación + duplicar + archivar/eliminar). Cierra el módulo.
-- =============================================

alter table public.campaign_pages
  add column if not exists confirmation_subject text,
  add column if not exists confirmation_body text,
  add column if not exists is_archived boolean not null default false;

-- 1. Email de confirmación al visitante — WHITE-LABEL (marca del tenant; NÚCLEO para el sentinela). Best-effort.
create or replace function public._campaign_confirm_email(_page public.campaign_pages, _to text, _name text)
 returns void language plpgsql security definer set search_path to 'public','extensions' as $function$
declare _key text; _sent uuid := '00000000-0000-0000-0000-0000000000a1'; _brand text; _color text; _sub text; _body text; _html text; _st int; _rp text; _es boolean := _page.lang <> 'en';
begin
  select decrypted_secret into _key from vault.decrypted_secrets where name='resend_api_key';
  if _key is null or coalesce(_to,'')='' then return; end if;
  if _page.tenant_id = _sent then _brand := 'NÚCLEO'; _color := '#eea62b';
  else select coalesce(nullif(trim(t.display_name),''), t.legal_name, 'Equipo'), coalesce(th.primary_color, '#4f46e5')
       into _brand, _color from public.tenants t left join public.tenant_themes th on th.tenant_id=t.id where t.id=_page.tenant_id;
  end if;
  _sub := coalesce(nullif(_page.confirmation_subject,''), case when _es then '¡Gracias por tu interés!' else 'Thank you for your interest!' end);
  _body := coalesce(nullif(_page.confirmation_body,''), case when _es then 'Recibimos tu mensaje y te contactaremos pronto.' else 'We received your message and will contact you soon.' end);
  _html := '<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1f2937">'
    || '<div style="border-top:4px solid '||_color||';padding:16px 0;font-size:22px;font-weight:700;color:'||_color||'">'||public._html_escape(_brand)||'</div>'
    || '<h1 style="font-size:20px;color:#111827">'||(case when _es then '¡Hola ' else 'Hi ' end)||public._html_escape(_name)||'!</h1>'
    || '<p style="line-height:1.6">'||public._html_escape(_body)||'</p></div>';
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS','3000');
  select status, content into _st, _rp from http(('POST','https://api.resend.com/emails', array[http_header('Authorization','Bearer '||_key)],'application/json',
    jsonb_build_object('from',_brand||' <noreply@raisen.agency>','to',_to,'subject',_sub,'html',_html)::text)::http_request);
exception when others then raise warning 'campaign confirm email fail page=% : %', _page.id, sqlerrm; -- best-effort
end $function$;

-- Guard en _notify_marketing_lead: para leads de campaña NO manda su confirmación genérica NÚCLEO (la campaña
-- manda la suya, white-label). Mantiene el email al admin. Resto IDÉNTICO.
create or replace function public._notify_marketing_lead()
 returns trigger language plpgsql security definer set search_path to 'public','extensions' as $function$
declare _key text; _cfg record; _es boolean := NEW.lang <> 'en'; _sub text; _html text; _st int; _rp text;
begin
  select decrypted_secret into _key from vault.decrypted_secrets where name = 'resend_api_key';
  if _key is null then raise warning 'lead email: falta resend_api_key lead=%', NEW.id; return NEW; end if;
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS', '3000');
  begin -- admin
    _html := '<h2 style="color:#111827">Nuevo lead comercial</h2><p><strong>'||public._html_escape(NEW.customer_name)||'</strong> · '||public._html_escape(NEW.lead_type)||'</p><p>'||public._html_escape(NEW.customer_email)||' · '||public._html_escape(coalesce(NEW.customer_phone,'—'))||' · '||public._html_escape(coalesce(NEW.company,'—'))||'</p>'||case when coalesce(NEW.message,'')<>'' then '<p style="background:#f3f4f6;padding:12px;border-radius:8px">'||public._html_escape(NEW.message)||'</p>' else '' end;
    select status, content into _st, _rp from http(('POST','https://api.resend.com/emails', array[http_header('Authorization','Bearer '||_key)],'application/json',
      jsonb_build_object('from','NÚCLEO <noreply@raisen.agency>','to','hola@raisen.agency','subject','Nuevo lead comercial: '||NEW.customer_name,'html','<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1f2937">'||_html||'</div>')::text)::http_request);
  exception when others then raise warning 'lead admin email fail lead=%: %', NEW.id, sqlerrm; end;
  if NEW.campaign_page_id is null then begin -- confirmación al visitante (solo leads NO-campaña)
    select confirmation_subject_es, confirmation_subject_en, confirmation_body_es, confirmation_body_en into _cfg from public.marketing_lead_form_config limit 1;
    _sub := case when _es then _cfg.confirmation_subject_es else _cfg.confirmation_subject_en end;
    _html := public._marketing_email_html(case when _es then '¡Gracias, '||public._html_escape(NEW.customer_name)||'!' else 'Thank you, '||public._html_escape(NEW.customer_name)||'!' end,
      '<p>'||public._html_escape(case when _es then _cfg.confirmation_body_es else _cfg.confirmation_body_en end)||'</p>'||case when coalesce(NEW.message,'')<>'' then '<p style="color:#83868e;font-size:13px">'||(case when _es then 'Tu mensaje: ' else 'Your message: ' end)||public._html_escape(NEW.message)||'</p>' else '' end);
    select status, content into _st, _rp from http(('POST','https://api.resend.com/emails', array[http_header('Authorization','Bearer '||_key)],'application/json',
      jsonb_build_object('from','NÚCLEO <noreply@raisen.agency>','to',NEW.customer_email,'subject',_sub,'html',_html)::text)::http_request);
  exception when others then raise warning 'lead visitor email fail lead=%: %', NEW.id, sqlerrm; end; end if;
  return NEW;
exception when others then raise warning 'lead notify fail lead=%: %', NEW.id, sqlerrm; return NEW;
end $function$;

-- 2. _campaign_create_lead: manda la confirmación de campaña (best-effort) tras crear el lead. Resto igual → se
-- reemplaza entero para insertar la llamada antes del return.
create or replace function public._campaign_create_lead(_host text, _payload jsonb, _client_ip text default 'unknown')
 returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $function$
declare _sentinel uuid := '00000000-0000-0000-0000-0000000000a1'; _h text := lower(trim(coalesce(_host,'')));
  _tenant uuid; _page public.campaign_pages; _name text; _email text; _phone text; _hits int; _lead uuid; _ceo uuid;
  _attr jsonb := coalesce(_payload->'attribution','{}'::jsonb);
begin
  if coalesce(_payload->>'hp','') <> '' then return jsonb_build_object('status','ok'); end if;
  _tenant := public._landing_resolve_tenant(_h);
  if _tenant is null then
    if regexp_replace(_h,'^www\.','') in ('nucleoraisen.com','nucleo-blush.vercel.app','localhost') then _tenant := _sentinel;
    else return jsonb_build_object('status','error','code','origin_not_allowed'); end if;
  end if;
  select * into _page from public.campaign_pages where id=(_payload->>'page_id')::uuid and tenant_id=_tenant and is_published and not is_archived;
  if _page.id is null then return jsonb_build_object('status','error','code','page_not_found'); end if;
  _name := trim(coalesce(_payload->>'customer_name','')); _email := lower(trim(coalesce(_payload->>'customer_email','')));
  _phone := coalesce(_payload->>'customer_phone','');
  if _name = '' or _email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return jsonb_build_object('status','error','code','invalid_payload'); end if;
  _hits := public._public_rate_hit(encode(extensions.digest(_h||'|'||_email||'|'||coalesce(nullif(_client_ip,''),'unknown'),'sha256'),'hex'));
  if _hits > 5 then return jsonb_build_object('status','error','code','rate_limited'); end if;
  if _tenant = _sentinel then
    insert into public.marketing_leads (lead_type, customer_name, customer_email, customer_phone, message, status,
      campaign_page_id, attribution, utm_source, utm_medium, utm_campaign)
    values ('business', _name, _email, nullif(_phone,''), _payload->>'message', 'new',
      _page.id, _attr, _attr->>'utm_source', _attr->>'utm_medium', _attr->>'utm_campaign') returning id into _lead;
  else
    select user_id into _ceo from public.user_roles where tenant_id=_tenant and role in ('ceo','superadmin') order by role limit 1;
    insert into public.leads (tenant_id, contact_name, phone, email, service_requested, lead_source, temperature, status,
      notes, custom_fields, campaign_page_id, attribution, created_by, attended_by)
    values (_tenant, _name, _phone, _email, nullif(_page.name,''), 'campaign', 'warm', 'new',
      _payload->>'message', coalesce(_payload->'custom_fields','[]'::jsonb), _page.id, _attr, _ceo, _ceo) returning id into _lead;
  end if;
  perform public._campaign_confirm_email(_page, _email, _name); -- white-label, best-effort (self-catch)
  return jsonb_build_object('status','ok','lead_id',_lead);
end $function$;

-- 3. Duplicar página + bloques (slug único -copia/-copia-2…), nace borrador. 4. Archivar. 5. Lista/render excluyen archivadas.
create or replace function public.duplicate_campaign_page(_id uuid)
 returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare _src public.campaign_pages; _new uuid; _slug text; _n int := 1;
begin
  select * into _src from public.campaign_pages where id=_id;
  if _src.id is null or not public._campaign_can_manage(_src.tenant_id) then raise exception 'NOT_AUTHORIZED'; end if;
  _slug := _src.slug||'-copia';
  while exists (select 1 from public.campaign_pages where tenant_id=_src.tenant_id and slug=_slug) loop
    _n := _n + 1; _slug := _src.slug||'-copia-'||_n; end loop;
  insert into public.campaign_pages (tenant_id, name, slug, seo_title, seo_description, og_image_url, lang,
    confirmation_subject, confirmation_body, is_published, is_archived)
  values (_src.tenant_id, _src.name||' (copia)', _slug, _src.seo_title, _src.seo_description, _src.og_image_url, _src.lang,
    _src.confirmation_subject, _src.confirmation_body, false, false) returning id into _new;
  insert into public.campaign_blocks (tenant_id, page_id, block_type, display_order, content_es, content_en, config, is_visible)
    select tenant_id, _new, block_type, display_order, content_es, content_en, config, is_visible
    from public.campaign_blocks where page_id=_id;
  return _new;
end $function$;
grant execute on function public.duplicate_campaign_page(uuid) to authenticated;

create or replace function public.set_campaign_archived(_id uuid, _archived boolean)
 returns void language plpgsql security definer set search_path to 'public' as $function$
begin
  update public.campaign_pages set is_archived=_archived, updated_at=now() where id=_id and public._campaign_can_manage(tenant_id);
  if not found then raise exception 'NOT_AUTHORIZED'; end if;
end $function$;
grant execute on function public.set_campaign_archived(uuid, boolean) to authenticated;

-- _public_get_campaign_page: una página archivada NO sirve (404). Solo se toca el WHERE de la página.
create or replace function public._public_get_campaign_page(_host text, _slug text, _preview boolean default false)
 returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $function$
declare _sentinel uuid := '00000000-0000-0000-0000-0000000000a1'; _h text := lower(trim(coalesce(_host,'')));
  _tenant uuid; _page public.campaign_pages; _blocks jsonb; _brand jsonb; _drafts boolean;
begin
  _tenant := public._landing_resolve_tenant(_h);
  if _tenant is null then
    if regexp_replace(_h,'^www\.','') in ('nucleoraisen.com','nucleo-blush.vercel.app','localhost') then _tenant := _sentinel;
    else return null; end if;
  end if;
  _drafts := coalesce(_preview,false) and public._campaign_can_manage(_tenant);
  select * into _page from public.campaign_pages where tenant_id=_tenant and slug=_slug and not is_archived and (_drafts or is_published) limit 1;
  if _page.id is null then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',b.id,'block_type',b.block_type,'display_order',b.display_order,
      'content_es',b.content_es,'content_en',b.content_en,'config',b.config) order by b.display_order),'[]'::jsonb)
    into _blocks from public.campaign_blocks b where b.page_id=_page.id and b.is_visible;
  if _tenant = _sentinel then _brand := null; else
    select jsonb_build_object('primary_color',th.primary_color,'accent_color',th.accent_color,'logo_url',th.logo_url,
      'display_name',coalesce(nullif(trim(t.display_name),''),t.legal_name),'theme_variant',th.default_mode) into _brand
    from public.tenants t left join public.tenant_themes th on th.tenant_id=t.id where t.id=_tenant;
  end if;
  return jsonb_build_object('page',jsonb_build_object('id',_page.id,'name',_page.name,'slug',_page.slug,
    'is_published',_page.is_published,'seo_title',_page.seo_title,'seo_description',_page.seo_description,
    'og_image_url',_page.og_image_url,'lang',_page.lang),'blocks',_blocks,'brand',_brand);
end $function$;

-- list_campaign_pages: +is_archived + param _include_archived (default oculta). DROP del () para no dejar overload.
drop function if exists public.list_campaign_pages();
create or replace function public.list_campaign_pages(_include_archived boolean default false)
 returns jsonb language sql stable security definer set search_path to 'public' as $function$
  select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'slug',p.slug,'is_published',p.is_published,
    'is_archived',p.is_archived,'updated_at',p.updated_at,'blocks',(select count(*) from public.campaign_blocks b where b.page_id=p.id),
    'visits',(select count(*) from public.tenant_landing_analytics a where a.tenant_id=p.tenant_id and a.path='/c/'||p.slug and a.event_type='page_view' and a.created_at >= now()-interval '30 days'),
    'leads',(select count(*) from public.marketing_leads m where m.campaign_page_id=p.id) + (select count(*) from public.leads l where l.campaign_page_id=p.id))
    order by p.updated_at desc),'[]'::jsonb)
  from public.campaign_pages p where public._campaign_can_manage(p.tenant_id) and (_include_archived or not p.is_archived);
$function$;
grant execute on function public.list_campaign_pages(boolean) to authenticated;
