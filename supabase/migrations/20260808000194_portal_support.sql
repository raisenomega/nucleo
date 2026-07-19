-- Portal P4 (2/2) — soporte del cliente. Reusa support_tickets + support_comments (hilo ya existente).
-- El ticket del customer se identifica por created_by = auth.uid() (NO hace falta customer_email). ADITIVO.

-- Customer ve SUS tickets y los comentarios de esos tickets.
create policy ticket_customer_select on public.support_tickets for select using (
  created_by = auth.uid() and exists (select 1 from public.customer_profiles cp where cp.user_id = auth.uid() and cp.tenant_id = support_tickets.tenant_id)
);
create policy comment_customer_select on public.support_comments for select using (
  exists (select 1 from public.support_tickets t where t.id = support_comments.ticket_id and t.created_by = auth.uid())
);

-- Crear ticket (definer: valida perfil en el tenant, ancla created_by = auth.uid()).
create or replace function public.customer_create_ticket(p_tenant_id uuid, p_subject text, p_description text, p_priority text default 'normal')
  returns uuid language plpgsql security definer set search_path to 'public' as $$
declare _uid uuid := auth.uid(); _id uuid;
begin
  if _uid is null then raise exception 'No autenticado'; end if;
  if not exists (select 1 from public.customer_profiles cp where cp.user_id = _uid and cp.tenant_id = p_tenant_id) then raise exception 'No autorizado'; end if;
  if coalesce(p_priority,'normal') not in ('low','normal','high','urgent') then p_priority := 'normal'; end if;
  insert into public.support_tickets(tenant_id, subject, description, priority, status, created_by)
    values (p_tenant_id, p_subject, nullif(p_description,''), coalesce(p_priority,'normal'), 'open', _uid) returning id into _id;
  return _id;
end $$;

-- Responder en su propio ticket.
create or replace function public.customer_reply_ticket(p_ticket_id uuid, p_content text)
  returns uuid language plpgsql security definer set search_path to 'public' as $$
declare _uid uuid := auth.uid(); _tenant uuid; _id uuid;
begin
  select tenant_id into _tenant from public.support_tickets where id = p_ticket_id and created_by = _uid;
  if _tenant is null then raise exception 'No autorizado'; end if;
  insert into public.support_comments(tenant_id, ticket_id, author_id, content) values (_tenant, p_ticket_id, _uid, p_content) returning id into _id;
  return _id;
end $$;

-- Notifica al CLIENTE creador del ticket cuando OTRO usuario (staff) comenta. Solo si el creador es customer → no cambia el flujo staff.
create or replace function public._notify_ticket_reply() returns trigger language plpgsql security definer set search_path to 'public' as $$
declare _creator uuid; _subj text;
begin
  select created_by, subject into _creator, _subj from public.support_tickets where id = new.ticket_id;
  if _creator is not null and _creator <> new.author_id
     and exists (select 1 from public.customer_profiles cp where cp.user_id = _creator) then
    insert into public.notifications(tenant_id, user_id, kind, title, body, entity_type, entity_id)
      values (new.tenant_id, _creator, 'ticket_reply', 'Respuesta a tu ticket', coalesce(_subj,''), 'ticket', new.ticket_id);
  end if;
  return new;
exception when others then return new;
end $$;
drop trigger if exists trg_notify_ticket_reply on public.support_comments;
create trigger trg_notify_ticket_reply after insert on public.support_comments for each row execute function public._notify_ticket_reply();

grant execute on function public.customer_create_ticket(uuid, text, text, text) to authenticated;
grant execute on function public.customer_reply_ticket(uuid, text) to authenticated;
