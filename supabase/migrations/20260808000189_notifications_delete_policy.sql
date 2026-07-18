-- Centro de notificaciones: falta policy DELETE para "dismiss" (select/update ya existen). RLS por usuario.
-- Navegación se deriva de entity_type/entity_id (ya existen) — no se toca ningún trigger.
create policy notifications_delete on public.notifications
  for delete using (user_id = auth.uid());
