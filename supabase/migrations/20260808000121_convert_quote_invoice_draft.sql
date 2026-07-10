-- 20260808000121_convert_quote_invoice_draft.sql
-- D7: la factura auto-generada al aceptar una cotización NO se envía sola. Nace en 'draft'
-- para que el CEO la revise y decida cuándo enviar. Antes convert_quote_to_invoice creaba 'sent'.
-- Único cambio vs la versión actual: 'sent' -> 'draft'. Sin frontend, sin migración de datos.
create or replace function public.convert_quote_to_invoice(p_quote_id uuid)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare _tenant uuid := current_tenant(); _q public.quotes%rowtype; _inv uuid;
begin
  if not public.can_access_module('quotes','edit') then raise exception 'No autorizado'; end if;
  select * into _q from quotes where id = p_quote_id and tenant_id = _tenant;
  if not found then raise exception 'Cotización no encontrada'; end if;
  if _q.linked_invoice_id is not null then raise exception 'Cotización ya convertida'; end if;
  if _q.status <> 'accepted' then raise exception 'La cotización debe estar aceptada'; end if;
  insert into invoices(tenant_id, client_name, phone, email, items, subtotal, tax, total, status, linked_lead_id, linked_quote_id, created_by)
    values(_tenant, _q.client_name, _q.client_phone, _q.client_email, _q.items, _q.subtotal, _q.tax_total, _q.total, 'draft', _q.linked_lead_id, p_quote_id, auth.uid())
    returning id into _inv;
  update quotes set status='converted', linked_invoice_id=_inv, responded_at=coalesce(responded_at, now()) where id=p_quote_id;
  return _inv;
end $$;
