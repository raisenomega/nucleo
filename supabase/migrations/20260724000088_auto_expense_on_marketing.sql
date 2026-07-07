-- 20260724000088_auto_expense_on_marketing.sql
-- PUENTE DE AUTO-CONTABILIDAD (3/6): gasto de marketing -> gasto en finanzas + enlace para sync.
-- SECURITY DEFINER (quien registra marketing puede no tener expenses.create). payment_method NOT NULL -> 'Efectivo'.
-- Guarda linked_expense_id en marketing_expenses (para el sync de borrado, migr 89).

create or replace function public.auto_expense_on_marketing()
returns trigger language plpgsql security definer set search_path = public as $$
declare _cat uuid; _pm uuid; _exp uuid;
begin
  if NEW.deleted_at is not null or coalesce(NEW.amount, 0) <= 0 then return NEW; end if;
  select id into _cat from public.categories
    where tenant_id = NEW.tenant_id and kind = 'expense' and label = 'Marketing' limit 1;
  if _cat is null then insert into public.categories(tenant_id, kind, label, expense_class, sort)
    values (NEW.tenant_id, 'expense', 'Marketing', 'variable', 81) returning id into _cat; end if;
  select id into _pm from public.categories
    where tenant_id = NEW.tenant_id and kind = 'payment_method' and label = 'Efectivo' limit 1;
  if _pm is null then insert into public.categories(tenant_id, kind, label, sort)
    values (NEW.tenant_id, 'payment_method', 'Efectivo', 90) returning id into _pm; end if;
  insert into public.expenses(tenant_id, category_id, payment_method_id, amount, expense_date, notes, created_by)
    values (NEW.tenant_id, _cat, _pm, NEW.amount, NEW.expense_date,
      'Gasto marketing: ' || coalesce(NEW.campaign_name, NEW.channel), NEW.created_by)
    returning id into _exp;
  update public.marketing_expenses set linked_expense_id = _exp where id = NEW.id;
  return NEW;
end $$;

drop trigger if exists trg_marketing_expense on public.marketing_expenses;
create trigger trg_marketing_expense after insert on public.marketing_expenses
  for each row execute function public.auto_expense_on_marketing();
