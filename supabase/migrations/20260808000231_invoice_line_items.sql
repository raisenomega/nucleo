-- 231 · Ola 2.3a · Líneas de factura normalizadas (modelo dual con el jsonb).
--
-- invoices.items jsonb (fuente del PDF de invoice.py) SE CONSERVA como snapshot inmutable. Añadimos
-- invoice_line_items como PROYECCIÓN derivada del jsonb por un trigger (fuente única = jsonb → imposible que
-- diverjan, atómico, PDF-safe). El jsonb gana `product_id` opcional por línea (la plantilla del PDF lo ignora);
-- product_id nullable = línea de texto/servicio (lo normal en Zafacones) vs línea de producto (con SKU/stock).
-- Cadena drill-down (2.3b): línea.product_id → tenant_landing_products → inventory_items → stock/movimientos.
-- Escritura solo por el trigger (DEFINER); el cliente no toca la tabla directo (solo SELECT por tenant).

create table if not exists public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  product_id uuid references public.tenant_landing_products(id) on delete set null,
  description text not null default '',
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  tax_pct numeric(5,2) not null default 0,
  discount_pct numeric(5,2) not null default 0,
  line_total numeric(12,2) not null default 0,
  sort int not null default 0,
  created_at timestamptz not null default now());
create index if not exists idx_invoice_line_items_invoice on public.invoice_line_items (invoice_id);
create index if not exists idx_invoice_line_items_product on public.invoice_line_items (product_id) where product_id is not null;

alter table public.invoice_line_items enable row level security;
drop policy if exists ili_select on public.invoice_line_items;
create policy ili_select on public.invoice_line_items for select using (tenant_id = public.current_tenant());

-- Trigger: re-deriva las líneas del jsonb items (fuente única). product_id se valida contra el catálogo del tenant
-- (uno inválido → NULL, no rompe el guardado de la factura).
create or replace function public._sync_invoice_lines() returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.invoice_line_items where invoice_id = new.id;
  insert into public.invoice_line_items (tenant_id, invoice_id, product_id, description, quantity, unit_price, tax_pct, discount_pct, line_total, sort)
  select new.tenant_id, new.id,
    case when exists (select 1 from public.tenant_landing_products p where p.id = (item->>'product_id')::uuid and p.tenant_id = new.tenant_id)
      then (item->>'product_id')::uuid else null end,
    coalesce(item->>'description',''), coalesce((item->>'quantity')::numeric, 1), coalesce((item->>'unit_price')::numeric, 0),
    coalesce((item->>'tax_pct')::numeric, 0), coalesce((item->>'discount_pct')::numeric, 0), coalesce((item->>'line_total')::numeric, 0),
    (ord - 1)::int
  from jsonb_array_elements(coalesce(new.items, '[]'::jsonb)) with ordinality as t(item, ord);
  return new;
end $$;
drop trigger if exists trg_sync_invoice_lines on public.invoices;
create trigger trg_sync_invoice_lines after insert or update of items on public.invoices
  for each row execute function public._sync_invoice_lines();

-- Backfill: parsear el jsonb de las facturas existentes (product_id NULL — son texto libre).
insert into public.invoice_line_items (tenant_id, invoice_id, description, quantity, unit_price, tax_pct, discount_pct, line_total, sort)
select i.tenant_id, i.id, coalesce(item->>'description',''), coalesce((item->>'quantity')::numeric, 1), coalesce((item->>'unit_price')::numeric, 0),
  coalesce((item->>'tax_pct')::numeric, 0), coalesce((item->>'discount_pct')::numeric, 0), coalesce((item->>'line_total')::numeric, 0), (ord - 1)::int
from public.invoices i, jsonb_array_elements(i.items) with ordinality as t(item, ord)
where i.items is not null and jsonb_array_length(i.items) > 0
  and not exists (select 1 from public.invoice_line_items l where l.invoice_id = i.id);
