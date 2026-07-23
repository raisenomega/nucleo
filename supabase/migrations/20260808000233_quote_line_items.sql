-- 233 · Ola 2.3c · Líneas de cotización normalizadas (espejo exacto de invoice_line_items, migr 231).
--
-- Mismo modelo dual: quotes.items jsonb (fuente del PDF de quote.py) SE CONSERVA; las líneas son una PROYECCIÓN
-- derivada por trigger. El jsonb gana product_id opcional por línea. Como convert_quote_to_invoice copia _q.items
-- VERBATIM, el product_id del quote fluye al jsonb de la factura → el trigger de invoice_line_items lo hereda
-- automáticamente (sin tocar convert). Escritura solo por el trigger (DEFINER); cliente solo SELECT por tenant.

create table if not exists public.quote_line_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  product_id uuid references public.tenant_landing_products(id) on delete set null,
  description text not null default '',
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  tax_pct numeric(5,2) not null default 0,
  discount_pct numeric(5,2) not null default 0,
  line_total numeric(12,2) not null default 0,
  sort int not null default 0,
  created_at timestamptz not null default now());
create index if not exists idx_quote_line_items_quote on public.quote_line_items (quote_id);
create index if not exists idx_quote_line_items_product on public.quote_line_items (product_id) where product_id is not null;

alter table public.quote_line_items enable row level security;
drop policy if exists qli_select on public.quote_line_items;
create policy qli_select on public.quote_line_items for select using (tenant_id = public.current_tenant());

-- Trigger: re-deriva las líneas del jsonb items (fuente única); product_id validado contra el catálogo (inválido→NULL).
create or replace function public._sync_quote_lines() returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.quote_line_items where quote_id = new.id;
  insert into public.quote_line_items (tenant_id, quote_id, product_id, description, quantity, unit_price, tax_pct, discount_pct, line_total, sort)
  select new.tenant_id, new.id,
    case when exists (select 1 from public.tenant_landing_products p where p.id = (item->>'product_id')::uuid and p.tenant_id = new.tenant_id)
      then (item->>'product_id')::uuid else null end,
    coalesce(item->>'description',''), coalesce((item->>'quantity')::numeric, 1), coalesce((item->>'unit_price')::numeric, 0),
    coalesce((item->>'tax_pct')::numeric, 0), coalesce((item->>'discount_pct')::numeric, 0), coalesce((item->>'line_total')::numeric, 0),
    (ord - 1)::int
  from jsonb_array_elements(coalesce(new.items, '[]'::jsonb)) with ordinality as t(item, ord);
  return new;
end $$;
drop trigger if exists trg_sync_quote_lines on public.quotes;
create trigger trg_sync_quote_lines after insert or update of items on public.quotes
  for each row execute function public._sync_quote_lines();

-- Backfill: parsear el jsonb de las cotizaciones existentes (product_id NULL — son texto libre).
insert into public.quote_line_items (tenant_id, quote_id, description, quantity, unit_price, tax_pct, discount_pct, line_total, sort)
select q.tenant_id, q.id, coalesce(item->>'description',''), coalesce((item->>'quantity')::numeric, 1), coalesce((item->>'unit_price')::numeric, 0),
  coalesce((item->>'tax_pct')::numeric, 0), coalesce((item->>'discount_pct')::numeric, 0), coalesce((item->>'line_total')::numeric, 0), (ord - 1)::int
from public.quotes q, jsonb_array_elements(q.items) with ordinality as t(item, ord)
where q.items is not null and jsonb_array_length(q.items) > 0
  and not exists (select 1 from public.quote_line_items l where l.quote_id = q.id);
