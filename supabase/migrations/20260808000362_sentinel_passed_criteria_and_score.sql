-- Sentinel · el resumen diario dejó de dar «Fallo» por el trabajo de seguridad legítimo, y por fin puntúa.
--
-- SÍNTOMA: 5 corridas seguidas de daily_summary en rojo desde el 29 jul, con failed_logins=0, brute_force=0 y
-- unresolved_events=0 en las cinco. Lo único distinto de cero era high_risk_actions (14 → 17 → 38 → 48 → 30).
--
-- CAUSA: cada migración de seguridad escribe en audit_log con risk_level 'high'/'critical', que es exactamente
-- lo que cuenta _highrisk. Es decir, SIDE-1→SIDE-8 hacían fallar el scan que ellos mismos endurecían. Un
-- semáforo que se pone en rojo cuando trabajas bien enseña a ignorarlo, que es la peor avería posible en un
-- panel de seguridad.
--
-- OJO — la función NO tenía una expresión de `passed` separada como suponía la orden: `passed` era
-- `not _notable`, y ese mismo `_notable` decide TAMBIÉN si se manda la notificación y el correo. Quitarle
-- _highrisk habría apagado en silencio el aviso de actividad de alto riesgo. Por eso aquí se SEPARAN los dos
-- conceptos: `_passed` (semáforo) es nuevo, y `_notable` (avisar) se deja byte-idéntico.
--
-- Y una segunda instancia del mismo error que la orden no había visto: `_notable` incluye `_blocked > 0`, o
-- sea las IPs actualmente bloqueadas. Bloquear una IP atacante es el sistema FUNCIONANDO, no un fallo. Al
-- salir del criterio de `passed`, deja de teñir de rojo un acierto (sigue avisando, que sí interesa).
--
-- El resto queda igual: mismas métricas, mismo _res, misma notificación, mismo correo.
create or replace function public.sentinel_daily_summary()
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions' as $$
declare _res jsonb; _notable boolean; _passed boolean; _score int;
  _logins int; _failed int; _brute int; _newip int; _newdev int; _blocked int; _highrisk int; _unresolved int;
begin
  select count(*) filter (where event_type='login_success'), count(*) filter (where event_type='login_failed'),
         count(*) filter (where event_type='brute_force_detected'), count(*) filter (where event_type='new_ip'),
         count(*) filter (where event_type='new_device')
    into _logins,_failed,_brute,_newip,_newdev
    from public.guardian_events where created_at > now()-interval '24 hours';
  select count(*) into _blocked from public.ip_watchlist where list_type='block' and (expires_at is null or expires_at>now());
  select count(*) into _highrisk from public.audit_log where created_at > now()-interval '24 hours' and risk_level in ('high','critical');
  select count(*) into _unresolved from public.guardian_events where not resolved and severity in ('high','critical');
  _res := jsonb_build_object('window','24h','logins',_logins,'failed_logins',_failed,'brute_force',_brute,
    'new_ips',_newip,'new_devices',_newdev,'blocked_ips',_blocked,'high_risk_actions',_highrisk,'unresolved_events',_unresolved);
  -- Semáforo: sólo lo que indica que algo va MAL. high_risk_actions y blocked_ips siguen en `results` para
  -- verlos en el panel, pero no lo tiñen de rojo.
  _passed := (_failed = 0 and _brute = 0 and _unresolved = 0);
  _score := greatest(0, 100 - (_failed * 5) - (_brute * 20) - (_unresolved * 10));
  -- Avisar sigue siendo más amplio que suspender: un pico de acciones de alto riesgo o una IP bloqueada
  -- merecen aparecer en el correo diario aunque el scan pase.
  _notable := (_failed>0 or _brute>0 or _blocked>0 or _highrisk>0 or _unresolved>0);
  insert into public.sentinel_scans(scan_type,score,passed,results,issues_count)
    values('daily_summary', _score, _passed, _res, _unresolved);
  if _notable then
    insert into public.notifications(tenant_id, user_id, kind, title, body, entity_type, entity_id)
      select ur.tenant_id, ur.user_id, 'security', 'Resumen de seguridad (24h)',
        _failed||' logins fallidos · '||_brute||' fuerza bruta · '||_blocked||' IPs bloqueadas · '||_unresolved||' eventos sin resolver', 'sentinel', null
      from public.user_roles ur where ur.role='superadmin'
        and not exists (select 1 from public.notifications n where n.user_id=ur.user_id and n.kind='security'
          and n.title='Resumen de seguridad (24h)' and n.created_at::date=now()::date);
    perform public._email_superadmins('🛡️ Resumen de seguridad diario — '||to_char(now(),'YYYY-MM-DD'),
      '<h2>🛡️ Resumen de seguridad (últimas 24h)</h2><ul>'||
      '<li>Logins exitosos: '||_logins||'</li><li>Logins fallidos: '||_failed||'</li>'||
      '<li>Fuerza bruta: '||_brute||'</li><li>IPs/dispositivos nuevos: '||_newip||'/'||_newdev||'</li>'||
      '<li>IPs bloqueadas: '||_blocked||'</li><li>Acciones de alto riesgo: '||_highrisk||'</li>'||
      '<li>Eventos sin resolver: '||_unresolved||'</li></ul>'||
      '<p><a href="https://nucleoraisen.com/security">Abrir panel de seguridad →</a></p>');
  end if;
  return _res;
end $$;

revoke execute on function public.sentinel_daily_summary() from public, anon, authenticated;
