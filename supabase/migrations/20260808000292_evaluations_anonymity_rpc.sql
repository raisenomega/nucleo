-- RRHH-0 TAREA 2: fix de privacidad del anonimato en evaluaciones.
-- El RLS eval_sel deja al evaluado leer su fila (employee_id = auth.uid()), y esa fila
-- incluye evaluator_id. Con is_anonymous=true, el evaluado puede ver quién lo evaluó vía
-- SELECT directo (el frontend solo lo oculta). Estos RPC SECURITY DEFINER enmascaran
-- evaluator_id (NULL) cuando la eval es anónima y el viewer NO es COO+ ni el propio evaluador.
-- El frontend lee de aquí en vez de hacer SELECT directo a la tabla.

create or replace function public.get_my_evaluations()
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select coalesce(jsonb_agg(row_to_json(x) order by x.created_at desc), '[]'::jsonb)
  from (
    select e.id, e.employee_id, e.period, e.composite_score, e.classification,
      e.in_probation, e.requires_legal_validation, e.eval_type, e.is_anonymous,
      case when e.is_anonymous and not public.is_coo_or_above() and e.evaluator_id <> auth.uid()
        then null else e.evaluator_id end as evaluator_id,
      e.status, e.notes, e.created_at, p.full_name as employee_name
    from public.evaluations e
    left join public.profiles p on p.id = e.employee_id
    where e.tenant_id = public.current_tenant()
      and (public.is_coo_or_above() or e.employee_id = auth.uid() or e.evaluator_id = auth.uid())
  ) x;
$$;

create or replace function public.get_evaluation_detail(p_id uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select jsonb_build_object(
    'id', e.id, 'employee_id', e.employee_id, 'period', e.period, 'composite_score', e.composite_score,
    'classification', e.classification, 'in_probation', e.in_probation,
    'requires_legal_validation', e.requires_legal_validation, 'eval_type', e.eval_type,
    'is_anonymous', e.is_anonymous, 'status', e.status, 'notes', e.notes, 'created_at', e.created_at,
    'employee_name', p.full_name,
    'evaluator_id', case when e.is_anonymous and not public.is_coo_or_above() and e.evaluator_id <> auth.uid()
      then null else e.evaluator_id end,
    'scores', (select coalesce(jsonb_agg(jsonb_build_object(
                 'criterion_id', s.criterion_id, 'label', c.label, 'score', s.score)), '[]'::jsonb)
               from public.evaluation_scores s
               left join public.evaluation_criteria c on c.id = s.criterion_id
               where s.evaluation_id = e.id)
  )
  from public.evaluations e
  left join public.profiles p on p.id = e.employee_id
  where e.id = p_id and e.tenant_id = public.current_tenant()
    and (public.is_coo_or_above() or e.employee_id = auth.uid() or e.evaluator_id = auth.uid());
$$;

grant execute on function public.get_my_evaluations() to authenticated;
grant execute on function public.get_evaluation_detail(uuid) to authenticated;
