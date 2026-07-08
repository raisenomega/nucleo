-- 20260731000106_quotes_schema.sql
-- MÓDULO COTIZACIONES (1/2): quotes. Hermano de invoices (mismo items jsonb) + flujo de aprobación.
-- RLS via can_access_module('quotes',*) (ceo/coo por catch-all). quote_number auto vía next_order_number.

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant() references public.tenants(id),
  quote_number text,
  client_name text not null, client_phone text, client_email text, client_address text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null default 0, tax_total numeric(12,2) not null default 0, total numeric(12,2) not null default 0,
  status text not null default 'draft' check (status in ('draft','sent','viewed','accepted','rejected','expired','converted')),
  valid_until date, notes text, terms text,
  linked_lead_id uuid references public.leads(id),
  linked_invoice_id uuid references public.invoices(id),
  sent_at timestamptz, viewed_at timestamptz, responded_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (tenant_id, quote_number)
);
create index if not exists idx_quotes_status on public.quotes(tenant_id, status, created_at desc);

-- Trazabilidad bidireccional: la factura apunta de vuelta a su cotización de origen.
alter table public.invoices add column if not exists linked_quote_id uuid references public.quotes(id);

-- Nº de cotización automático (reutiliza el contador atómico por tenant).
create or replace function public.set_quote_number()
returns trigger language plpgsql set search_path = public as $$
begin
  if NEW.quote_number is null then NEW.quote_number := public.next_order_number(NEW.tenant_id); end if;
  return NEW;
end $$;
drop trigger if exists trg_quote_number on public.quotes;
create trigger trg_quote_number before insert on public.quotes for each row execute function public.set_quote_number();

alter table public.quotes enable row level security;
create policy quote_all on public.quotes for all to authenticated
  using (tenant_id = public.current_tenant() and public.can_access_module('quotes','view'))
  with check (tenant_id = public.current_tenant() and public.can_access_module('quotes','create'));

drop trigger if exists trg_updated_at on public.quotes;
create trigger trg_updated_at before update on public.quotes for each row execute function public.set_updated_at();
