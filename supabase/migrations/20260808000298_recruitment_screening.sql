-- RRHH-1B — Screening automatizado: exámenes online + verificación de docs + upload anónimo.
-- El candidato se auto-filtra: toma exámenes (calificación automática), sube documentos, y si aprueba
-- todo + docs verificados → avanza solo a 'interview'; si agota intentos sin pasar → rechazo automático.

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLAS
-- ═══════════════════════════════════════════════════════════════════════════
create table public.recruitment_exams (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  title text not null,
  description text,
  questions jsonb not null default '[]'::jsonb,
  passing_score numeric not null default 70,
  max_attempts integer not null default 2,
  time_limit_minutes integer,
  shuffle_questions boolean default true,
  shuffle_options boolean default true,
  show_correct_answers boolean default false,
  is_active boolean not null default true,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  exam_id uuid not null references public.recruitment_exams(id),
  applicant_id uuid not null references public.applicants(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  score numeric,
  passed boolean,
  total_points integer,
  earned_points integer,
  started_at timestamptz default now(),
  submitted_at timestamptz,
  time_spent_seconds integer,
  attempt_number integer not null default 1,
  created_at timestamptz default now(),
  unique (exam_id, applicant_id, attempt_number)
);
create index idx_exam_attempts_applicant on public.exam_attempts(tenant_id, applicant_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS — staff CEO+; los intentos se crean por RPC pública (candidato anónimo).
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.recruitment_exams enable row level security;
alter table public.exam_attempts enable row level security;
create policy rex_sel on public.recruitment_exams for select using (tenant_id = public.current_tenant());
create policy rex_wr on public.recruitment_exams for all
  using (tenant_id = public.current_tenant() and public.is_ceo_or_above())
  with check (tenant_id = public.current_tenant() and public.is_ceo_or_above());
create policy ea_sel on public.exam_attempts for select
  using (tenant_id = public.current_tenant() and public.is_ceo_or_above());

-- Upload ANÓNIMO de documentos: policy INSERT acotada a folders {tenant}/{applicant} válidos.
-- (Un RPC SQL no puede acuñar signed-URLs; esta policy permite subir directo al bucket privado,
--  solo si el path apunta a un applicant real de ese tenant. Lectura/borrado siguen siendo staff.)
create policy applicant_docs_anon_insert on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'applicant-docs' and exists (
    select 1 from public.applicants a
    where a.id::text = (storage.foldername(name))[2] and a.tenant_id::text = (storage.foldername(name))[1]));

create trigger trg_rex_updated before update on public.recruitment_exams
  for each row execute function public.set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- RPCs staff — CRUD de exámenes
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.create_recruitment_exam(p_data jsonb)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare _id uuid;
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  insert into public.recruitment_exams(tenant_id, title, description, questions, passing_score, max_attempts,
    time_limit_minutes, shuffle_questions, shuffle_options, show_correct_answers, created_by)
  values (public.current_tenant(), p_data->>'title', p_data->>'description', coalesce(p_data->'questions','[]'::jsonb),
    coalesce((p_data->>'passing_score')::numeric, 70), coalesce((p_data->>'max_attempts')::int, 2),
    (p_data->>'time_limit_minutes')::int, coalesce((p_data->>'shuffle_questions')::boolean, true),
    coalesce((p_data->>'shuffle_options')::boolean, true), coalesce((p_data->>'show_correct_answers')::boolean, false),
    auth.uid())
  returning id into _id;
  return _id;
end $$;

create or replace function public.update_recruitment_exam(p_id uuid, p_data jsonb)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  update public.recruitment_exams set
    title = coalesce(p_data->>'title', title), description = coalesce(p_data->>'description', description),
    questions = coalesce(p_data->'questions', questions), passing_score = coalesce((p_data->>'passing_score')::numeric, passing_score),
    max_attempts = coalesce((p_data->>'max_attempts')::int, max_attempts),
    time_limit_minutes = coalesce((p_data->>'time_limit_minutes')::int, time_limit_minutes),
    shuffle_questions = coalesce((p_data->>'shuffle_questions')::boolean, shuffle_questions),
    shuffle_options = coalesce((p_data->>'shuffle_options')::boolean, shuffle_options),
    show_correct_answers = coalesce((p_data->>'show_correct_answers')::boolean, show_correct_answers),
    is_active = coalesce((p_data->>'is_active')::boolean, is_active), updated_at = now()
  where id = p_id and tenant_id = public.current_tenant();
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- RPC pública — el candidato ve el examen SIN respuestas correctas (+ shuffle).
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.get_exam_for_applicant(p_applicant_id uuid, p_exam_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare e record; _used int; _passed bool; _qs jsonb;
begin
  select * into e from public.recruitment_exams where id = p_exam_id and is_active = true;
  if e.id is null then return jsonb_build_object('error', 'not_found'); end if;
  if not exists (select 1 from public.applicants where id = p_applicant_id and tenant_id = e.tenant_id) then
    return jsonb_build_object('error', 'not_found'); end if;
  select count(*) into _used from public.exam_attempts where exam_id = p_exam_id and applicant_id = p_applicant_id;
  select bool_or(passed) into _passed from public.exam_attempts where exam_id = p_exam_id and applicant_id = p_applicant_id;
  if coalesce(_passed, false) then
    return jsonb_build_object('status', 'passed', 'title', e.title, 'attempts_used', _used, 'max_attempts', e.max_attempts,
      'score', (select max(score) from public.exam_attempts where exam_id = p_exam_id and applicant_id = p_applicant_id));
  end if;
  if _used >= e.max_attempts then
    return jsonb_build_object('status', 'exhausted', 'title', e.title, 'attempts_used', _used, 'max_attempts', e.max_attempts);
  end if;
  -- construir preguntas sin 'correct', con shuffle opcional de preguntas y de opciones
  select coalesce(jsonb_agg(q order by case when e.shuffle_questions then random() else ord::float8 end), '[]'::jsonb) into _qs
  from (
    select (case when e.shuffle_options and (x->'options') is not null then
              (x - 'correct') || jsonb_build_object('options', (select jsonb_agg(o order by random()) from jsonb_array_elements(x->'options') o))
            else x - 'correct' end) as q, ord
    from jsonb_array_elements(e.questions) with ordinality as t(x, ord)) s;
  return jsonb_build_object('status', 'available', 'exam_id', e.id, 'title', e.title, 'description', e.description,
    'time_limit_minutes', e.time_limit_minutes, 'passing_score', e.passing_score, 'attempts_used', _used,
    'max_attempts', e.max_attempts, 'questions', _qs);
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- RPC pública — enviar intento: califica, registra, actualiza applicant, auto-advance/reject.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.submit_exam_attempt(p_applicant_id uuid, p_exam_id uuid, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare e record; _tenant uuid; _used int; _total numeric := 0; _earned numeric := 0; _q jsonb; _pts numeric;
        _ans jsonb; _type text; _score numeric; _passed bool; _attempt int;
begin
  select * into e from public.recruitment_exams where id = p_exam_id and is_active = true;
  if e.id is null then raise exception 'Examen no encontrado'; end if;
  select tenant_id into _tenant from public.applicants where id = p_applicant_id and tenant_id = e.tenant_id;
  if _tenant is null then raise exception 'Candidato no encontrado'; end if;
  select count(*) into _used from public.exam_attempts where exam_id = p_exam_id and applicant_id = p_applicant_id;
  if _used >= e.max_attempts then raise exception 'Sin intentos disponibles'; end if;
  if exists (select 1 from public.exam_attempts where exam_id = p_exam_id and applicant_id = p_applicant_id and passed = true) then
    raise exception 'Ya aprobaste este examen'; end if;
  for _q in select * from jsonb_array_elements(e.questions) loop
    _pts := coalesce((_q->>'points')::numeric, 1); _total := _total + _pts;
    _ans := p_answers -> (_q->>'id'); _type := _q->>'type';
    if _type = 'multiple_select' then
      if (select coalesce(array_agg(v order by v), '{}') from jsonb_array_elements_text(coalesce(_ans,'[]'::jsonb)) v)
         = (select coalesce(array_agg(v order by v), '{}') from jsonb_array_elements_text(_q->'correct') v)
      then _earned := _earned + _pts; end if;
    elsif _ans is not null and _ans = (_q->'correct') then _earned := _earned + _pts; end if;
  end loop;
  _score := case when _total > 0 then round(100.0 * _earned / _total, 1) else 0 end;
  _passed := _score >= e.passing_score; _attempt := _used + 1;
  insert into public.exam_attempts(tenant_id, exam_id, applicant_id, answers, score, passed, total_points, earned_points,
    submitted_at, attempt_number) values (_tenant, p_exam_id, p_applicant_id, p_answers, _score, _passed, _total, _earned, now(), _attempt);
  update public.applicants set exam_scores = coalesce(exam_scores, '{}'::jsonb) || jsonb_build_object(
    p_exam_id::text, jsonb_build_object('score', _score, 'passed', _passed, 'attempts', _attempt, 'title', e.title)),
    stage = case when stage = 'applied' then 'exams' else stage end, updated_at = now() where id = p_applicant_id;
  perform public._check_screening_complete(p_applicant_id);
  return jsonb_build_object('score', _score, 'passed', _passed, 'earned', _earned, 'total', _total,
    'attempts_used', _attempt, 'max_attempts', e.max_attempts,
    'feedback', case when e.show_correct_answers then (select jsonb_object_agg(q->>'id', q->'correct') from jsonb_array_elements(e.questions) q) else null end);
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- RPC pública — estado de screening del candidato (docs + exámenes).
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.get_applicant_screening_status(p_applicant_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare a record; pos record; _reqdocs jsonb; _exams jsonb; _docs_ok bool;
begin
  select * into a from public.applicants where id = p_applicant_id;
  if a.id is null then return jsonb_build_object('error', 'not_found'); end if;
  select jp.title, jp.required_documents, jp.required_exam_ids into pos
    from public.job_openings o join public.job_positions jp on jp.id = o.position_id where o.id = a.opening_id;
  _reqdocs := coalesce(pos.required_documents, '[]'::jsonb);
  _docs_ok := not exists (select 1 from jsonb_array_elements_text(_reqdocs) rd
    where not exists (select 1 from jsonb_array_elements(coalesce(a.documents_uploaded, '[]'::jsonb)) du
                      where du->>'name' = rd and (du->>'verified')::boolean is true));
  select coalesce(jsonb_agg(jsonb_build_object('exam_id', re.id, 'title', re.title, 'max_attempts', re.max_attempts,
    'attempts_used', (select count(*) from public.exam_attempts ea where ea.applicant_id = a.id and ea.exam_id = re.id),
    'status', case when exists (select 1 from public.exam_attempts ea where ea.applicant_id = a.id and ea.exam_id = re.id and ea.passed = true) then 'passed'
      when (select count(*) from public.exam_attempts ea where ea.applicant_id = a.id and ea.exam_id = re.id) >= re.max_attempts then 'failed' else 'pending' end,
    'score', (select max(score) from public.exam_attempts ea where ea.applicant_id = a.id and ea.exam_id = re.id))), '[]'::jsonb) into _exams
  from unnest(coalesce(pos.required_exam_ids, '{}')) as ex(exam_id) join public.recruitment_exams re on re.id = ex.exam_id;
  return jsonb_build_object('applicant_name', a.full_name, 'position_title', pos.title, 'stage', a.stage,
    'documents', jsonb_build_object('required', _reqdocs, 'uploaded', coalesce(a.documents_uploaded, '[]'::jsonb), 'complete', _docs_ok),
    'exams', _exams, 'auto_rejected', a.stage = 'rejected');
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- RPC pública — path de subida (el frontend sube directo al bucket con la policy anon).
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.get_applicant_upload_path(p_applicant_id uuid, p_filename text)
returns text language plpgsql security definer set search_path to 'public' as $$
declare _tenant uuid; _safe text;
begin
  select tenant_id into _tenant from public.applicants where id = p_applicant_id;
  if _tenant is null then raise exception 'Candidato no encontrado'; end if;
  _safe := regexp_replace(coalesce(p_filename, 'doc'), '[^a-zA-Z0-9._-]', '_', 'g');
  return _tenant::text || '/' || p_applicant_id::text || '/' || substr(md5(gen_random_uuid()::text), 1, 8) || '-' || _safe;
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- RPC staff — verificar un documento; recheck de screening.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.verify_applicant_document(p_applicant_id uuid, p_document_name text, p_verified boolean)
returns void language plpgsql security definer set search_path to 'public' as $$
declare pos_docs jsonb; _all_ok bool;
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  update public.applicants set documents_uploaded = (
    select jsonb_agg(case when du->>'name' = p_document_name then du || jsonb_build_object('verified', p_verified) else du end)
    from jsonb_array_elements(coalesce(documents_uploaded, '[]'::jsonb)) du), updated_at = now()
  where id = p_applicant_id and tenant_id = public.current_tenant();
  select jp.required_documents into pos_docs from public.applicants a
    join public.job_openings o on o.id = a.opening_id join public.job_positions jp on jp.id = o.position_id where a.id = p_applicant_id;
  _all_ok := not exists (select 1 from jsonb_array_elements_text(coalesce(pos_docs, '[]'::jsonb)) rd
    where not exists (select 1 from public.applicants a, jsonb_array_elements(coalesce(a.documents_uploaded, '[]'::jsonb)) du
                      where a.id = p_applicant_id and du->>'name' = rd and (du->>'verified')::boolean is true));
  update public.applicants set documents_verified = _all_ok where id = p_applicant_id;
  perform public._check_screening_complete(p_applicant_id);
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- Auto-advance / auto-reject: llamado tras calificar examen o verificar documento.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public._check_screening_complete(p_applicant_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare a record; pos record; _docs_ok bool; _exams_ok bool; _failed bool; _has_req bool; _ceo uuid;
begin
  select * into a from public.applicants where id = p_applicant_id;
  if a.stage not in ('applied', 'screening', 'documents', 'exams') then return; end if;
  select jp.title, jp.required_documents, jp.required_exam_ids into pos
    from public.job_openings o join public.job_positions jp on jp.id = o.position_id where o.id = a.opening_id;
  _has_req := coalesce(array_length(pos.required_exam_ids, 1), 0) > 0
    or jsonb_array_length(coalesce(pos.required_documents, '[]'::jsonb)) > 0;
  if not _has_req then return; end if;
  _docs_ok := not exists (select 1 from jsonb_array_elements_text(coalesce(pos.required_documents, '[]'::jsonb)) rd
    where not exists (select 1 from jsonb_array_elements(coalesce(a.documents_uploaded, '[]'::jsonb)) du
                      where du->>'name' = rd and (du->>'verified')::boolean is true));
  _exams_ok := not exists (select 1 from unnest(coalesce(pos.required_exam_ids, '{}')) as ex(exam_id)
    where not exists (select 1 from public.exam_attempts ea where ea.applicant_id = a.id and ea.exam_id = ex.exam_id and ea.passed = true));
  _failed := exists (select 1 from unnest(coalesce(pos.required_exam_ids, '{}')) as ex(exam_id)
    join public.recruitment_exams re on re.id = ex.exam_id
    where (select count(*) from public.exam_attempts ea where ea.applicant_id = a.id and ea.exam_id = ex.exam_id) >= re.max_attempts
      and not exists (select 1 from public.exam_attempts ea where ea.applicant_id = a.id and ea.exam_id = ex.exam_id and ea.passed = true));
  if _failed then
    update public.applicants set stage = 'rejected', decision = 'rejected',
      decision_notes = 'Auto: no aprobó un examen requerido', updated_at = now() where id = a.id;
    for _ceo in select user_id from public.user_roles where tenant_id = a.tenant_id and role in ('ceo', 'superadmin') loop
      begin perform public._notify_user(a.tenant_id, _ceo, 'applicant_rejected', 'Candidato rechazado (screening)',
        a.full_name || ' no aprobó el examen de ' || coalesce(pos.title, ''), 'applicant', a.id); exception when others then null; end;
    end loop;
    return;
  end if;
  if _docs_ok and _exams_ok then
    update public.applicants set stage = 'interview', updated_at = now() where id = a.id;
    for _ceo in select user_id from public.user_roles where tenant_id = a.tenant_id and role in ('ceo', 'superadmin') loop
      begin perform public._notify_user(a.tenant_id, _ceo, 'screening_complete', 'Screening completado',
        a.full_name || ' completó el screening de ' || coalesce(pos.title, ''), 'applicant', a.id); exception when others then null; end;
    end loop;
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- Email al candidato con el link de screening (Resend, best-effort).
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public._send_screening_email()
returns trigger language plpgsql security definer set search_path to 'public, extensions' as $$
declare _key text; _host text; _name text; _title text; _link text; _html text;
begin
  select allowed_origins->>0, coalesce(display_name, legal_name) into _host, _name from public.tenants where id = new.tenant_id;
  if _host is null or _host = '' then return new; end if;
  select decrypted_secret into _key from vault.decrypted_secrets where name = 'resend_api_key';
  if _key is null then return new; end if;
  select jp.title into _title from public.job_openings o join public.job_positions jp on jp.id = o.position_id where o.id = new.opening_id;
  _link := 'https://' || _host || '/screening/' || new.id::text;
  _html := '<p>Gracias por aplicar a <b>' || coalesce(_title, 'la vacante') || '</b> en ' || coalesce(_name, '') ||
    '.</p><p>Para continuar tu proceso, completa tus documentos y exámenes:</p><p><a href="' || _link || '">' || _link || '</a></p>';
  begin
    perform http(('POST', 'https://api.resend.com/emails', array[http_header('Authorization', 'Bearer ' || _key)],
      'application/json', jsonb_build_object('from', coalesce(_name, 'Reclutamiento') || ' <noreply@raisen.agency>',
        'to', new.email, 'subject', 'Continúa tu aplicación — ' || coalesce(_title, ''), 'html', _html)::text)::http_request);
  exception when others then null; end;
  return new;
end $$;
create trigger trg_send_screening_email after insert on public.applicants
  for each row execute function public._send_screening_email();

-- ═══════════════════════════════════════════════════════════════════════════
-- GRANTS — RPCs públicas (candidato anónimo).
-- ═══════════════════════════════════════════════════════════════════════════
grant execute on function public.get_exam_for_applicant(uuid, uuid) to anon, authenticated;
grant execute on function public.submit_exam_attempt(uuid, uuid, jsonb) to anon, authenticated;
grant execute on function public.get_applicant_screening_status(uuid) to anon, authenticated;
grant execute on function public.get_applicant_upload_path(uuid, text) to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED demo (tenant Vital) — 2 exámenes + vincular al puesto + 1 intento de Carlos.
-- ═══════════════════════════════════════════════════════════════════════════
do $$
declare _t uuid := '9ffea055-7d2a-4fec-a61e-517d0ad79492';
        _ceo uuid := 'd4065008-85bf-42c4-81a9-6d04a404cf6b';
        _e1 uuid; _e2 uuid; _pos uuid; _carlos uuid;
begin
  if not exists (select 1 from public.tenants where id = _t) then return; end if;
  if exists (select 1 from public.recruitment_exams where tenant_id = _t) then return; end if;

  insert into public.recruitment_exams(tenant_id, title, description, passing_score, max_attempts, created_by, questions)
  values (_t, 'Quiz de Seguridad y Protocolos', 'EPP, derrames, emergencias y ergonomía.', 80, 2, _ceo, '[
    {"id":"q1","type":"multiple_choice","text":"¿Qué hacer ante un derrame químico?","points":1,"options":[{"id":"a","text":"Limpiarlo sin protección"},{"id":"b","text":"Reportar al supervisor y asegurar el área"},{"id":"c","text":"Ignorarlo si es pequeño"}],"correct":"b"},
    {"id":"q2","type":"multiple_select","text":"El EPP incluye:","points":1,"options":[{"id":"a","text":"Guantes"},{"id":"b","text":"Gafas de seguridad"},{"id":"c","text":"Sandalias"},{"id":"d","text":"Casco si aplica"}],"correct":["a","b","d"]},
    {"id":"q3","type":"true_false","text":"Ante emergencia, primero evacuar de forma ordenada.","statement":"Lo primero es evacuar el área de forma ordenada","points":1,"correct":true},
    {"id":"q4","type":"multiple_choice","text":"Al levantar peso se debe:","points":1,"options":[{"id":"a","text":"Doblar la espalda"},{"id":"b","text":"Flexionar las rodillas"}],"correct":"b"},
    {"id":"q5","type":"true_false","text":"Se puede omitir el EPP si hay prisa.","statement":"El EPP es opcional si hay prisa","points":1,"correct":false}]'::jsonb)
  returning id into _e1;

  insert into public.recruitment_exams(tenant_id, title, description, passing_score, max_attempts, created_by, questions)
  values (_t, 'Quiz de Servicio al Cliente', 'Comunicación, puntualidad y manejo de quejas.', 70, 2, _ceo, '[
    {"id":"q1","type":"multiple_choice","text":"Ante una queja del cliente:","points":1,"options":[{"id":"a","text":"Escuchar y ofrecer solución"},{"id":"b","text":"Ignorar"},{"id":"c","text":"Discutir"}],"correct":"a"},
    {"id":"q2","type":"multiple_choice","text":"La puntualidad es:","points":1,"options":[{"id":"a","text":"Opcional"},{"id":"b","text":"Fundamental"}],"correct":"b"},
    {"id":"q3","type":"multiple_choice","text":"Un buen saludo transmite:","points":1,"options":[{"id":"a","text":"Profesionalismo"},{"id":"b","text":"Indiferencia"}],"correct":"a"},
    {"id":"q4","type":"multiple_choice","text":"Si no sabes una respuesta:","points":1,"options":[{"id":"a","text":"Inventas"},{"id":"b","text":"Consultas y das seguimiento"}],"correct":"b"}]'::jsonb)
  returning id into _e2;

  select id into _pos from public.job_positions where tenant_id = _t and title = 'Terapeuta Físico';
  if _pos is not null then update public.job_positions set required_exam_ids = array[_e1, _e2] where id = _pos; end if;

  select id into _carlos from public.applicants where tenant_id = _t and lower(email) = 'carlos.rivera@example.com';
  if _carlos is not null then
    insert into public.exam_attempts(tenant_id, exam_id, applicant_id, answers, score, passed, total_points, earned_points, submitted_at, attempt_number)
    values (_t, _e1, _carlos, '{"q1":"b","q2":["a","b","d"],"q3":true,"q4":"b","q5":false}'::jsonb, 95, true, 5, 5, now(), 1)
    on conflict do nothing;
    update public.applicants set exam_scores = jsonb_build_object(_e1::text, jsonb_build_object('score', 95, 'passed', true, 'attempts', 1, 'title', 'Quiz de Seguridad y Protocolos'))
    where id = _carlos;
  end if;
end $$;
