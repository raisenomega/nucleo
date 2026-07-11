-- Fase 3 · Sesión 2B · Migración 130: particionamiento (pg_cron) + funciones + jobs + RLS cleanup.
-- Solo tenant_landing_analytics se particiona. webhook_events NO (idempotencia por event.id).

-- Crea la partición del PRÓXIMO mes para analytics (idempotente).
create or replace function public.create_monthly_partitions()
returns void language plpgsql security definer set search_path = public, extensions as $fn$
declare _cid uuid := gen_random_uuid();
  _start date := (date_trunc('month', now()) + interval '1 month')::date;
  _end   date := (date_trunc('month', now()) + interval '2 months')::date;
  _p text := 'tenant_landing_analytics_' || to_char(_start,'YYYY_MM');
begin
  execute format('create table if not exists public.%I partition of public.tenant_landing_analytics for values from (%L) to (%L)', _p, _start, _end);
  raise notice 'create_monthly_partitions [%] partición % (%→%)', _cid, _p, _start, _end;
end $fn$;

-- Safety net on-demand: crea la partición del mes de _date si no existe.
create or replace function public._ensure_partition_exists(_table_name text, _date date)
returns void language plpgsql security definer set search_path = public, extensions as $fn$
declare _start date := date_trunc('month', _date)::date;
  _end date := (date_trunc('month', _date) + interval '1 month')::date;
  _p text := _table_name || '_' || to_char(_start,'YYYY_MM');
begin
  execute format('create table if not exists public.%I partition of public.%I for values from (%L) to (%L)', _p, _table_name, _start, _end);
end $fn$;

-- Consolida el mes -3 en metrics_daily/monthly (incl. filas en DEFAULT), dropea la partición raw,
-- y purga webhooks viejos procesados. Retorna resumen.
create or replace function public.consolidate_and_purge_analytics()
returns jsonb language plpgsql security definer set search_path = public, extensions as $fn$
declare _cid uuid := gen_random_uuid();
  _m date := (date_trunc('month', now()) - interval '3 months')::date;
  _end date := (date_trunc('month', now()) - interval '2 months')::date;
  _p text := 'tenant_landing_analytics_' || to_char(_m,'YYYY_MM');
  _daily int := 0; _webhooks int := 0;
begin
  insert into public.tenant_landing_metrics_daily (tenant_id, metric_date, event_type, count, unique_sessions, unique_visitors)
  select tenant_id, created_at::date, event_type, count(*), count(distinct session_id), count(distinct visitor_id)
    from public.tenant_landing_analytics where created_at >= _m and created_at < _end
    group by tenant_id, created_at::date, event_type
  on conflict (tenant_id, metric_date, event_type) do update
    set count = excluded.count, unique_sessions = excluded.unique_sessions, unique_visitors = excluded.unique_visitors;
  get diagnostics _daily = row_count;

  insert into public.tenant_landing_metrics_monthly (tenant_id, metric_month, event_type, count, unique_sessions, unique_visitors)
  select tenant_id, _m, event_type, count(*), count(distinct session_id), count(distinct visitor_id)
    from public.tenant_landing_analytics where created_at >= _m and created_at < _end
    group by tenant_id, event_type
  on conflict (tenant_id, metric_month, event_type) do update
    set count = excluded.count, unique_sessions = excluded.unique_sessions, unique_visitors = excluded.unique_visitors;

  -- limpia de DEFAULT las filas del rango ya consolidadas, luego dropea la partición del mes -3
  delete from public.tenant_landing_analytics_default where created_at >= _m and created_at < _end;
  execute format('drop table if exists public.%I', _p);

  delete from public.stripe_webhook_events where processed = true and received_at < now() - interval '90 days';
  get diagnostics _webhooks = row_count;

  raise notice 'consolidate_and_purge [%] mes=% daily=% webhooks_purged=%', _cid, _p, _daily, _webhooks;
  return jsonb_build_object('month', _m, 'partition_dropped', _p, 'daily_rows', _daily, 'webhooks_deleted', _webhooks);
exception when others then
  raise warning 'consolidate_and_purge [%] EXCEPTION sqlstate=% msg=%', _cid, sqlstate, sqlerrm;
  raise;
end $fn$;

-- Monitor: cuántas filas hay en la partición DEFAULT (alerta si >0 sostenido).
create or replace function public.alert_default_partition_count()
returns jsonb language plpgsql stable security definer set search_path = public, extensions as $fn$
declare _c bigint;
begin
  select count(*) into _c from public.tenant_landing_analytics_default;
  return jsonb_build_object('default_count', _c, 'threshold_exceeded', _c > 0);
end $fn$;

-- Cleanup P2.A: rate_limit_public sin RLS quedaba expuesta a anon → deny-all.
alter table public.rate_limit_public enable row level security;
comment on table public.rate_limit_public is 'Interna. RLS enabled sin policies (deny-all). Solo accedida desde _public_rate_hit SECURITY DEFINER.';

-- pg_cron + jobs (día 25 crea partición próxima; día 5 consolida+purga).
create extension if not exists pg_cron;
select cron.schedule('create_monthly_partitions', '0 3 25 * *', 'select public.create_monthly_partitions()');
select cron.schedule('consolidate_and_purge_analytics', '0 4 5 * *', 'select public.consolidate_and_purge_analytics()');
