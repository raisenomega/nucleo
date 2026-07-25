-- GL · Fix get_trial_balance: filtrar status + período ANTES de sumar (Ola 3 · bugfix)
-- Bug (migr 272): status/período estaban en el ON del LEFT JOIN a journal_entries, pero la suma es sobre
-- journal_entry_lines → al ser LEFT join, las líneas de asientos voided/draft/fuera-de-período sobrevivían y
-- se contaban (saldos por cuenta inflados; el filtro de período no hacía nada). P&L(C8)/Balance(C9) no lo tenían.
-- Fix: subconsulta que hace INNER JOIN líneas→asientos y filtra status='posted'+período, LUEGO LEFT JOIN a las cuentas.
-- Se conservan firma, tipo de retorno (RETURNS TABLE) y current_tenant() interno (no romper el frontend ni el aislamiento).
create or replace function public.get_trial_balance(p_year integer default null, p_month integer default null)
 returns table(account_id uuid, account_code text, account_name text, account_type text, normal_balance text, total_debit numeric, total_credit numeric, balance numeric)
 language sql stable security definer set search_path to 'public'
as $function$
  select a.id, a.account_code, a.account_name, a.account_type, a.normal_balance,
    coalesce(sum(l.debit),0), coalesce(sum(l.credit),0),
    case when a.normal_balance = 'debit' then coalesce(sum(l.debit),0) - coalesce(sum(l.credit),0)
         else coalesce(sum(l.credit),0) - coalesce(sum(l.debit),0) end
  from public.chart_of_accounts a
  left join (
    select l.account_id, l.debit, l.credit
    from public.journal_entry_lines l
    join public.journal_entries e on e.id = l.entry_id
    where e.tenant_id = current_tenant() and e.status = 'posted'
      and (p_year is null or e.period_year = p_year)
      and (p_month is null or e.period_month = p_month)
  ) l on l.account_id = a.id
  where a.tenant_id = current_tenant() and a.active and not a.is_header
    and public.can_access_module('accounting','view')
  group by a.id, a.account_code, a.account_name, a.account_type, a.normal_balance
  having coalesce(sum(l.debit),0) <> 0 or coalesce(sum(l.credit),0) <> 0
  order by a.account_code;
$function$;
