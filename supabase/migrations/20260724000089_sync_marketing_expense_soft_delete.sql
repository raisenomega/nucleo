-- 20260724000089_sync_marketing_expense_soft_delete.sql
-- PUENTE DE AUTO-CONTABILIDAD (4/6): borrar (soft) un gasto de marketing borra también el gasto vinculado.
-- Mantiene consistencia entre marketing_expenses y su expense auto-generado (migr 88). SECURITY DEFINER.

create or replace function public.sync_marketing_expense_soft_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if NEW.linked_expense_id is not null then
    update public.expenses
      set deleted_at = NEW.deleted_at, deleted_by = NEW.deleted_by
      where id = NEW.linked_expense_id and deleted_at is null;
  end if;
  return NEW;
end $$;

drop trigger if exists trg_marketing_delete_sync on public.marketing_expenses;
create trigger trg_marketing_delete_sync after update on public.marketing_expenses
  for each row when (OLD.deleted_at is null and NEW.deleted_at is not null)
  execute function public.sync_marketing_expense_soft_delete();
