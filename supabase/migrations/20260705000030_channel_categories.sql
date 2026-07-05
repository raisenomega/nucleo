-- 20260705000030_channel_categories.sql
-- Marketing v2: canales configurables (categories kind='channel') + mapeo lead_source→channel.

-- 1) categories: ampliar CHECK de kind con 'channel'.
do $$
declare _c text;
begin
  select conname into _c from pg_constraint
   where conrelid = 'public.categories'::regclass and contype = 'c'
     and pg_get_constraintdef(oid) ilike '%kind%';
  if _c is not null then execute format('alter table public.categories drop constraint %I', _c); end if;
end $$;
alter table public.categories add constraint categories_kind_check
  check (kind in ('income','expense','extraordinary','payment_method','lead_source','service_type','channel'));

-- 2) Seed 9 canales demo a tenants EXISTENTES (trials nuevos → create_trial_tenant en 00031).
insert into public.categories (tenant_id, kind, label, sort)
select t.id, 'channel', s.label, s.ord from public.tenants t
cross join (values ('Facebook Ads',1),('Instagram Ads',2),('Google Ads',3),('TikTok Ads',4),
  ('Email Marketing',5),('WhatsApp',6),('Referidos',7),('Eventos',8),('Otro',9)) s(label, ord)
on conflict (tenant_id, kind, label) do nothing;

-- 3) Mapeo lead_source (label) → channel (label) para atribución de leads a marketing.
create or replace function public.channel_for_source(p_source text)
returns text language sql immutable as $$
  select case p_source
    when 'Facebook'  then 'Facebook Ads'
    when 'Instagram' then 'Instagram Ads'
    when 'Google'    then 'Google Ads'
    when 'TikTok'    then 'TikTok Ads'
    when 'WhatsApp'  then 'WhatsApp'
    when 'Referido'  then 'Referidos'
    else null end;
$$;
