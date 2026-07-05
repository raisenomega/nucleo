-- 20260705000015_submit_consultation.sql
-- Slice #2 Trial: RPC para que un trial expirado (autenticado) agende consulta.
-- Identidad (contact_name/email/business_name/tenant_id) se resuelve del profile+tenant en sesión;
-- el form solo aporta los 4 campos cualitativos. Opción A.

create or replace function public.submit_consultation(
  business_type text, employee_count text, main_problem text, desired_start text
) returns void language plpgsql security definer
set search_path = public as $$
declare
  _tenant uuid := public.current_tenant();
  _name text;
  _email text;
  _business text;
begin
  select full_name, email into _name, _email from public.profiles where id = auth.uid();
  select legal_name into _business from public.tenants where id = _tenant;

  insert into public.consultation_requests
    (tenant_id, contact_name, business_name, business_type, employee_count, main_problem, desired_start, email)
  values
    (_tenant, _name, _business, business_type, employee_count, main_problem, desired_start, _email);
end; $$;

grant execute on function public.submit_consultation(text,text,text,text) to authenticated;
