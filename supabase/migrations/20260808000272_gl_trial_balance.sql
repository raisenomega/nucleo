-- GL · Balance de comprobación (Ola 3 · Sesión C6)
-- Saldos por cuenta hoja de los asientos posteados (opcional por año/mes). Gated por accounting.view.
create or replace function public.get_trial_balance(p_year int default null, p_month int default null)
returns table(account_id uuid, account_code text, account_name text, account_type text, normal_balance text,
  total_debit numeric, total_credit numeric, balance numeric)
language sql stable security definer set search_path to 'public' as $function$
  select a.id, a.account_code, a.account_name, a.account_type, a.normal_balance,
    coalesce(sum(l.debit),0), coalesce(sum(l.credit),0),
    case when a.normal_balance = 'debit' then coalesce(sum(l.debit),0) - coalesce(sum(l.credit),0)
         else coalesce(sum(l.credit),0) - coalesce(sum(l.debit),0) end
  from public.chart_of_accounts a
  left join public.journal_entry_lines l on l.account_id = a.id
  left join public.journal_entries e on e.id = l.entry_id and e.tenant_id = current_tenant() and e.status = 'posted'
    and (p_year is null or e.period_year = p_year) and (p_month is null or e.period_month = p_month)
  where a.tenant_id = current_tenant() and a.active and not a.is_header
    and public.can_access_module('accounting','view')
  group by a.id, a.account_code, a.account_name, a.account_type, a.normal_balance
  having coalesce(sum(l.debit),0) <> 0 or coalesce(sum(l.credit),0) <> 0
  order by a.account_code;
$function$;
grant execute on function public.get_trial_balance(int, int) to authenticated;
