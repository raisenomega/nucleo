-- GL · Posting de facturas (accrual), pagos, nómina y extraordinarios (Ola 3 · Sesión C4)
-- Solo bajo gl_enabled=true. Diseño: docs-nucleo/ARQUITECTURA-GL-NUCLEO.md §3.
-- Cuentas usadas ya existen en el seed C1: 1120,1119,4100,2120,6100,6110,2140.

-- ============ TAREA 3 · guard de income para cobros de factura (corrige C2) ============
-- record_invoice_payment inserta el income ANTES del invoice_payment → un EXISTS al momento del insert
-- del income no vería el pago. Guard doble: por el vínculo (cualquier orden) + por la categoría 'Facturación'
-- que usa record_invoice_payment. El cobro se postea por el trigger de invoice_payments (Dr 1119/Cr 1120).
create or replace function public._gl_post_income()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare _code text;
begin
  if not coalesce((select gl_enabled from public.tenants where id = NEW.tenant_id), false) then return NEW; end if;
  if exists (select 1 from public.invoice_payments p where p.linked_income_id = NEW.id)
     or exists (select 1 from public.categories c where c.id = NEW.category_id and c.kind = 'income' and c.label = 'Facturación') then
    return NEW;  -- cobro de factura: el ingreso ya se devengó al emitir; lo postea invoice_payments
  end if;
  _code := public._category_to_account_code(NEW.category_id);
  perform public._gl_post(NEW.tenant_id, NEW.income_date, coalesce(nullif(NEW.notes,''), 'Ingreso'), 'income', NEW.id,
    jsonb_build_array(
      jsonb_build_object('account_code','1119','debit',NEW.amount,'credit',0,'description','Entrada de efectivo'),
      jsonb_build_object('account_code',_code,'debit',0,'credit',NEW.amount,'description',NEW.notes)
    ), NEW.created_by);
  return NEW;
end $$;

-- ============ TAREA 1 · facturas (accrual): devenga al salir de draft; anula al cancelar ============
create or replace function public._gl_post_invoice()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare _accrue boolean := false; _rev numeric; _tax numeric;
begin
  if not coalesce((select gl_enabled from public.tenants where id = NEW.tenant_id), false) then return NEW; end if;
  if tg_op = 'INSERT' then
    _accrue := NEW.status not in ('draft','cancelled');
  else
    if NEW.status = 'cancelled' and OLD.status <> 'cancelled' then
      update public.journal_entries set status='voided', voided_at=now(), voided_by=auth.uid(), void_reason='Factura cancelada'
        where tenant_id=NEW.tenant_id and source_type='invoice' and source_id=NEW.id and status='posted';
      return NEW;
    end if;
    _accrue := OLD.status = 'draft' and NEW.status not in ('draft','cancelled');
  end if;
  if not _accrue then return NEW; end if;
  if exists (select 1 from public.journal_entries where tenant_id=NEW.tenant_id and source_type='invoice' and source_id=NEW.id and status='posted') then return NEW; end if;
  _tax := round(coalesce(NEW.tax,0),2);
  _rev := round(coalesce(NEW.total,0) - _tax, 2);
  perform public._gl_post(NEW.tenant_id, coalesce(NEW.created_at::date, current_date),
    'Factura '||coalesce(NEW.invoice_number,'')||' — '||coalesce(NEW.client_name,''), 'invoice', NEW.id,
    jsonb_build_array(
      jsonb_build_object('account_code','1120','debit',NEW.total,'credit',0,'description','Cuenta por cobrar'),
      jsonb_build_object('account_code','4100','debit',0,'credit',_rev,'description','Ingreso devengado'),
      jsonb_build_object('account_code','2120','debit',0,'credit',_tax,'description','IVU por pagar')
    ), NEW.created_by);
  return NEW;
end $$;

-- ============ TAREA 2 · pagos de factura: Dr 1119 / Cr 1120; DELETE (void_invoice_payment) → anula ============
create or replace function public._gl_post_invoice_payment()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if tg_op = 'DELETE' then
    if coalesce((select gl_enabled from public.tenants where id = OLD.tenant_id), false) then
      update public.journal_entries set status='voided', voided_at=now(), voided_by=auth.uid(), void_reason='Pago anulado'
        where tenant_id=OLD.tenant_id and source_type='invoice_payment' and source_id=OLD.id and status='posted';
    end if;
    return OLD;
  end if;
  if not coalesce((select gl_enabled from public.tenants where id = NEW.tenant_id), false) then return NEW; end if;
  perform public._gl_post(NEW.tenant_id, NEW.payment_date, 'Cobro de factura', 'invoice_payment', NEW.id,
    jsonb_build_array(
      jsonb_build_object('account_code','1119','debit',NEW.amount,'credit',0,'description','Entrada de efectivo'),
      jsonb_build_object('account_code','1120','debit',0,'credit',NEW.amount,'description','Reduce cuenta por cobrar')
    ), NEW.created_by);
  return NEW;
end $$;

-- ============ TAREA 4 · nómina: Dr 6100 bruto + Dr 6110 patronal / Cr 1119 neto + Cr 2140 EE + Cr 2120 ER ============
create or replace function public._gl_post_payroll()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare _gross numeric; _net numeric; _emp numeric; _ee numeric; _er numeric; _lines jsonb;
begin
  if not coalesce((select gl_enabled from public.tenants where id = NEW.tenant_id), false) then return NEW; end if;
  _gross := coalesce(nullif(NEW.gross_salary,0), NEW.amount, 0);
  _net   := coalesce(nullif(NEW.net_salary,0), _gross);
  _emp   := coalesce(nullif(NEW.total_employer_cost,0), _gross);
  if _gross <= 0 then return NEW; end if;
  _ee := round(greatest(_gross - _net, 0), 2);
  _er := round(greatest(_emp - _gross, 0), 2);
  _lines := jsonb_build_array(
    jsonb_build_object('account_code','6100','debit',round(_gross,2),'credit',0,'description','Sueldo bruto'),
    jsonb_build_object('account_code','1119','debit',0,'credit',round(_net,2),'description','Neto pagado'));
  if _ee > 0 then _lines := _lines || jsonb_build_array(
    jsonb_build_object('account_code','2140','debit',0,'credit',_ee,'description','Retenciones al empleado')); end if;
  if _er > 0 then _lines := _lines
    || jsonb_build_array(jsonb_build_object('account_code','6110','debit',_er,'credit',0,'description','Aportes patronales (gasto)'))
    || jsonb_build_array(jsonb_build_object('account_code','2120','debit',0,'credit',_er,'description','Impuestos patronales por pagar')); end if;
  perform public._gl_post(NEW.tenant_id, NEW.pay_date, 'Nómina', 'payroll', NEW.id, _lines, NEW.created_by);
  return NEW;
end $$;

-- ============ TAREA 5 · pagos extraordinarios: Dr [cuenta gasto] / Cr 1119 ============
create or replace function public._gl_post_extraordinary()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare _code text;
begin
  if not coalesce((select gl_enabled from public.tenants where id = NEW.tenant_id), false) then return NEW; end if;
  _code := public._category_to_account_code(NEW.category_id);
  perform public._gl_post(NEW.tenant_id, NEW.payment_date, 'Pago extraordinario', 'expense', NEW.id,
    jsonb_build_array(
      jsonb_build_object('account_code',_code,'debit',NEW.amount,'credit',0,'description','Gasto extraordinario'),
      jsonb_build_object('account_code','1119','debit',0,'credit',NEW.amount,'description','Salida de efectivo')
    ), NEW.created_by);
  return NEW;
end $$;

-- ============ triggers ============
drop trigger if exists trg_gl_post_invoice on public.invoices;
create trigger trg_gl_post_invoice after insert or update on public.invoices
  for each row execute function public._gl_post_invoice();

drop trigger if exists trg_gl_post_invoice_payment on public.invoice_payments;
create trigger trg_gl_post_invoice_payment after insert or delete on public.invoice_payments
  for each row execute function public._gl_post_invoice_payment();

drop trigger if exists trg_gl_post_payroll on public.payroll;
create trigger trg_gl_post_payroll after insert on public.payroll
  for each row execute function public._gl_post_payroll();

drop trigger if exists trg_gl_void_payroll on public.payroll;
create trigger trg_gl_void_payroll after update of deleted_at on public.payroll
  for each row execute function public._gl_void_on_soft_delete('payroll');

drop trigger if exists trg_gl_post_extraordinary on public.extraordinary_payments;
create trigger trg_gl_post_extraordinary after insert on public.extraordinary_payments
  for each row execute function public._gl_post_extraordinary();

drop trigger if exists trg_gl_void_extraordinary on public.extraordinary_payments;
create trigger trg_gl_void_extraordinary after update of deleted_at on public.extraordinary_payments
  for each row execute function public._gl_void_on_soft_delete('expense');
