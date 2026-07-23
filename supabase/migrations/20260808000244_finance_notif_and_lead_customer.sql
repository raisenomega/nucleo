-- =============================================
-- Ola 2.6c-2 + 2.6d · Notif finanzas/inventario + leads↔maestro (cierran Ola 2.6)
-- A) Extiende notify_daily_reminders (243) con 3 bloques. B) leads.customer_id (solo enlaza, nunca crea).
-- =============================================

-- ===== PARTE A: cron con 3 bloques nuevos (mismo patrón: ventana acotada + dedup por entity_id+kind) =====
create or replace function public.notify_daily_reminders() returns void language plpgsql security definer set search_path to 'public' as $function$
declare _t date := current_date;
begin
  perform public._notify_user(a.tenant_id, a.created_by,
    case when a.due_date < _t then 'task_overdue' else 'task_today' end,
    case when a.due_date < _t then 'Tarea de seguimiento vencida' else 'Tarea de seguimiento para hoy' end,
    coalesce(a.body,''), 'lead', a.id)
  from public.lead_activities a
  where a.kind='task' and a.done_at is null and a.due_date is not null and a.due_date between _t - 14 and _t and a.created_by is not null;
  perform public._notify_user(c.tenant_id, r.uid, 'cert_expiring_30d', 'Certificación por vencer',
    coalesce(c.certification_name,'Certificación')||' vence '||to_char(c.expiration_date,'YYYY-MM-DD'), 'certification', c.id)
  from public.employee_certifications c
  left join public.employee_details ed on ed.profile_id=c.profile_id and ed.tenant_id=c.tenant_id
  cross join lateral unnest(array_remove(array[c.profile_id, ed.supervisor_id], null)) as r(uid)
  where c.expiration_date between _t and _t + 30;
  perform public._notify_user(tr.tenant_id, tr.employee_id, 'training_due_7d', 'Curso por vencer', '', 'training', tr.id)
  from public.training_enrollments tr
  where tr.status <> 'completed' and tr.due_date is not null and tr.due_date between _t - 14 and _t + 7 and tr.employee_id is not null;
  perform public._notify_user(ed.tenant_id, ed.supervisor_id, 'probation_ending_15d', 'Fin de probatorio',
    to_char(ed.probation_end_date,'YYYY-MM-DD'), 'employee', ed.profile_id)
  from public.employee_details ed where ed.probation_end_date between _t and _t + 15 and ed.supervisor_id is not null;
  perform public._notify_user(ed.tenant_id, r.uid, 'medical_exam_30d', 'Examen médico por vencer',
    to_char(ed.medical_exam_next,'YYYY-MM-DD'), 'employee', ed.profile_id)
  from public.employee_details ed cross join lateral unnest(array_remove(array[ed.profile_id, ed.supervisor_id], null)) as r(uid)
  where ed.medical_exam_next between _t and _t + 30;
  perform public._notify_user(ed.tenant_id, r.uid, 'drug_test_30d', 'Prueba de dopaje por vencer',
    to_char(ed.drug_test_date,'YYYY-MM-DD'), 'employee', ed.profile_id)
  from public.employee_details ed cross join lateral unnest(array_remove(array[ed.profile_id, ed.supervisor_id], null)) as r(uid)
  where ed.drug_test_date between _t and _t + 30;
  -- 7. Factura vencida (ventana 60d) → CEO/owner(s)
  perform public._notify_user(i.tenant_id, ur.user_id, 'invoice_overdue', 'Factura '||coalesce(i.invoice_number,'')||' vencida',
    '$'||to_char(coalesce(i.balance,0),'FM999999990.00')||' pendientes desde '||to_char(i.due_date,'YYYY-MM-DD'), 'invoice', i.id)
  from public.invoices i
  join public.user_roles ur on ur.tenant_id=i.tenant_id and ur.role in ('ceo','superadmin')
  where i.due_date < _t and i.due_date >= _t - 60 and i.status not in ('paid','cancelled') and coalesce(i.balance,0) > 0;
  -- 8. Stock bajo → CEO/owner(s)
  perform public._notify_user(it.tenant_id, ur.user_id, 'stock_low', 'Stock bajo: '||coalesce(it.name,''),
    it.stock||' unidades (mínimo '||it.min_stock||')', 'inventory_item', it.id)
  from public.inventory_items it
  join public.user_roles ur on ur.tenant_id=it.tenant_id and ur.role in ('ceo','superadmin')
  where it.min_stock > 0 and it.stock <= it.min_stock;
  -- 9. Documento por vencer (dentro de su reminder_days) → CEO/owner(s)
  perform public._notify_user(d.tenant_id, ur.user_id, 'document_expiring', 'Documento por vencer: '||coalesce(d.title,''),
    'vence '||to_char(d.expiration_date,'YYYY-MM-DD'), 'document', d.id)
  from public.documents d
  join public.user_roles ur on ur.tenant_id=d.tenant_id and ur.role in ('ceo','superadmin')
  where d.status='active' and d.expiration_date is not null and d.expiration_date between _t and _t + coalesce(d.reminder_days, 30);
end $function$;

-- ===== PARTE B: leads.customer_id (2.6d) — solo enlaza, nunca crea (un lead es prospecto) =====
alter table public.leads add column if not exists customer_id uuid references public.customer_profiles(id) on delete set null;
create index if not exists idx_leads_customer on public.leads (customer_id);

-- Resolver: email directo (fuerte) → fallback teléfono (2.4a, link-only). NO usa _resolve_customer_by_email (ese CREA).
create or replace function public._resolve_customer_for_lead(_tenant uuid, _email text, _phone text)
 returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare _id uuid;
begin
  if _email is not null and trim(_email) <> '' then
    select id into _id from public.customer_profiles where tenant_id=_tenant and lower(trim(email))=lower(trim(_email)) limit 1;
    if _id is not null then return _id; end if;
  end if;
  return public._resolve_customer_by_phone(_tenant, _phone);
end $function$;

create or replace function public._lead_autolink_customer() returns trigger language plpgsql security definer set search_path to 'public' as $function$
begin
  if new.customer_id is null then new.customer_id := public._resolve_customer_for_lead(new.tenant_id, new.email, new.phone); end if;
  return new;
end $function$;
drop trigger if exists trg_lead_autolink_customer on public.leads;
create trigger trg_lead_autolink_customer before insert on public.leads for each row execute function public._lead_autolink_customer();

-- save_lead_with_items: persistir customer_id (INSERT+UPDATE) para el selector manual. Resto IDÉNTICO a la def viva.
create or replace function public.save_lead_with_items(lead jsonb, items jsonb)
 returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare _id uuid := nullif(lead->>'id', '')::uuid; _tenant uuid := public.current_tenant();
begin
  if _id is null then
    insert into public.leads (contact_name, phone, email, address, city, zip_code, lead_source_id, service_type_id,
      temperature, status, call_date, notes, quoted_price, evidence_urls, customer_id)
    values (lead->>'contact_name', lead->>'phone', nullif(lead->>'email',''), lead->>'address', lead->>'city',
      lead->>'zip_code', nullif(lead->>'lead_source_id','')::uuid, nullif(lead->>'service_type_id','')::uuid,
      lead->>'temperature', lead->>'status', (lead->>'call_date')::date, lead->>'notes',
      nullif(lead->>'quoted_price','')::numeric, coalesce(lead->'evidence_urls', '[]'::jsonb), nullif(lead->>'customer_id','')::uuid)
    returning id into _id;
  else
    update public.leads set contact_name = lead->>'contact_name', phone = lead->>'phone', email = nullif(lead->>'email',''),
      address = lead->>'address', city = lead->>'city', zip_code = lead->>'zip_code',
      lead_source_id = nullif(lead->>'lead_source_id','')::uuid, service_type_id = nullif(lead->>'service_type_id','')::uuid,
      temperature = lead->>'temperature', status = lead->>'status', call_date = (lead->>'call_date')::date,
      notes = lead->>'notes', quoted_price = nullif(lead->>'quoted_price','')::numeric,
      evidence_urls = coalesce(lead->'evidence_urls', '[]'::jsonb), customer_id = nullif(lead->>'customer_id','')::uuid
    where id = _id and tenant_id = _tenant;
  end if;
  delete from public.lead_items where lead_id = _id;
  insert into public.lead_items (lead_id, description, quantity, unit_price, tax_pct, discount_pct, sort)
  select _id, x->>'description', (x->>'quantity')::numeric, (x->>'unit_price')::numeric,
    coalesce((x->>'tax_pct')::numeric, 0), coalesce((x->>'discount_pct')::numeric, 0), (ord - 1)::int
  from jsonb_array_elements(coalesce(items, '[]'::jsonb)) with ordinality as t(x, ord);
  return jsonb_build_object('id', _id);
end; $function$;

-- Backfill: enlazar leads existentes cuyo email/teléfono ya está en el maestro (no crea).
update public.leads l set customer_id = public._resolve_customer_for_lead(l.tenant_id, l.email, l.phone) where l.customer_id is null;
