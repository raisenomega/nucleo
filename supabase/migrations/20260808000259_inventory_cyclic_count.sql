-- 20260808000259 · Inventory Gap Fix #5 — Conteo cíclico / inventario físico
-- Proceso: crear (snapshot stock teórico) → contar (blind) → revisar varianza → aprobar → aplicar (record_adjustment batch).
-- inventory_count_lines lleva tenant_id directo (como inventory_purchase_order_items) para RLS simple + validador.

create table public.inventory_counts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  count_number text not null,
  status text not null default 'draft' check (status in ('draft','in_progress','completed','approved','applied','cancelled')),
  count_type text not null default 'partial' check (count_type in ('full','partial','category','low_stock')),
  category_id uuid references public.categories(id),
  assigned_to uuid references public.profiles(id),
  notes text,
  blind_count boolean not null default true,
  started_at timestamptz, completed_at timestamptz, approved_at timestamptz,
  approved_by uuid references public.profiles(id), applied_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz default now(), updated_at timestamptz default now(), deleted_at timestamptz,
  unique (tenant_id, count_number)
);

create table public.inventory_count_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  count_id uuid not null references public.inventory_counts(id) on delete cascade,
  item_id uuid not null references public.inventory_items(id),
  expected_qty numeric not null,
  counted_qty numeric,
  variance numeric generated always as (counted_qty - expected_qty) stored,
  variance_pct numeric generated always as (
    case when expected_qty = 0 then null else round(((counted_qty - expected_qty) / expected_qty) * 100, 2) end
  ) stored,
  unit_cost_at_count numeric,
  line_status text not null default 'pending' check (line_status in ('pending','counted','approved','rejected','applied')),
  counted_by uuid references public.profiles(id), counted_at timestamptz, notes text,
  unique (count_id, item_id)
);

alter table public.inventory_counts enable row level security;
alter table public.inventory_count_lines enable row level security;

create policy inv_counts_select on public.inventory_counts for select to authenticated using (tenant_id = current_tenant());
create policy inv_counts_insert on public.inventory_counts for insert to authenticated with check (tenant_id = current_tenant() and can_access_module('inventory','edit'));
create policy inv_counts_update on public.inventory_counts for update to authenticated using (tenant_id = current_tenant() and can_access_module('inventory','edit'));
create policy inv_counts_delete on public.inventory_counts for delete to authenticated using (tenant_id = current_tenant() and can_access_module('inventory','delete'));
create policy inv_count_lines_select on public.inventory_count_lines for select to authenticated using (tenant_id = current_tenant());
create policy inv_count_lines_insert on public.inventory_count_lines for insert to authenticated with check (tenant_id = current_tenant() and can_access_module('inventory','edit'));
create policy inv_count_lines_update on public.inventory_count_lines for update to authenticated using (tenant_id = current_tenant() and can_access_module('inventory','edit'));
create policy inv_count_lines_delete on public.inventory_count_lines for delete to authenticated using (tenant_id = current_tenant() and can_access_module('inventory','delete'));

create trigger trg_updated_at before update on public.inventory_counts for each row execute function public.set_updated_at();

-- RPC 1: crear conteo con snapshot del stock teórico por ítem según el tipo.
create or replace function public.create_inventory_count(p_count_type text, p_category_id uuid default null, p_assigned_to uuid default null, p_blind boolean default true, p_notes text default null, p_item_ids uuid[] default null)
 returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare _t uuid := current_tenant(); _cid uuid; _num text;
begin
  if not public.can_access_module('inventory','edit') then raise exception 'No autorizado'; end if;
  _num := 'CC-' || lpad((coalesce((select max((regexp_replace(count_number,'\D','','g'))::int) from public.inventory_counts where tenant_id = _t), 0) + 1)::text, 3, '0');
  insert into public.inventory_counts(tenant_id, count_number, count_type, category_id, assigned_to, blind_count, notes, created_by)
    values (_t, _num, p_count_type, p_category_id, p_assigned_to, coalesce(p_blind, true), nullif(p_notes,''), auth.uid()) returning id into _cid;
  insert into public.inventory_count_lines(tenant_id, count_id, item_id, expected_qty, unit_cost_at_count)
    select _t, _cid, i.id, i.stock, i.avg_cost from public.inventory_items i
    where i.tenant_id = _t and (
      (p_count_type = 'full') or
      (p_count_type = 'category' and i.category_id = p_category_id) or
      (p_count_type = 'low_stock' and i.min_stock > 0 and i.stock <= i.min_stock) or
      (p_count_type = 'partial' and i.id = any(p_item_ids)));
  return _cid;
end $function$;

-- RPC 2: registrar la cantidad contada de una línea (avanza el estado del conteo).
create or replace function public.record_count_line(p_line_id uuid, p_counted_qty numeric, p_notes text default null)
 returns void language plpgsql security definer set search_path to 'public' as $function$
declare _t uuid := current_tenant(); _cid uuid; _status text;
begin
  if not public.can_access_module('inventory','edit') then raise exception 'No autorizado'; end if;
  select l.count_id, c.status into _cid, _status from public.inventory_count_lines l join public.inventory_counts c on c.id = l.count_id
    where l.id = p_line_id and l.tenant_id = _t;
  if _cid is null then raise exception 'Línea no encontrada'; end if;
  if _status not in ('draft','in_progress') then raise exception 'El conteo no admite cambios'; end if;
  update public.inventory_count_lines set counted_qty = p_counted_qty, counted_by = auth.uid(), counted_at = now(),
    line_status = 'counted', notes = coalesce(nullif(p_notes,''), notes) where id = p_line_id;
  if _status = 'draft' then update public.inventory_counts set status='in_progress', started_at=now() where id=_cid; end if;
  if not exists (select 1 from public.inventory_count_lines where count_id=_cid and line_status='pending') then
    update public.inventory_counts set status='completed', completed_at=now() where id=_cid; end if;
end $function$;

-- RPC 3: aprobar/rechazar líneas en batch (CEO). Cierra el conteo a 'approved' cuando ninguna queda pendiente.
create or replace function public.approve_count_lines(p_count_id uuid, p_line_ids uuid[], p_action text)
 returns void language plpgsql security definer set search_path to 'public' as $function$
declare _t uuid := current_tenant(); _new text;
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  _new := case when p_action='approve' then 'approved' when p_action='reject' then 'rejected' else null end;
  if _new is null then raise exception 'Acción inválida'; end if;
  perform 1 from public.inventory_counts where id=p_count_id and tenant_id=_t and status='completed';
  if not found then raise exception 'Conteo no revisable'; end if;
  update public.inventory_count_lines set line_status=_new
    where count_id=p_count_id and id = any(p_line_ids) and line_status in ('counted','approved','rejected');
  if not exists (select 1 from public.inventory_count_lines where count_id=p_count_id and line_status not in ('approved','rejected')) then
    update public.inventory_counts set status='approved', approved_at=now(), approved_by=auth.uid() where id=p_count_id; end if;
end $function$;

-- RPC 4: aplicar el conteo aprobado → record_adjustment batch (respeta el guard de stock negativo del Fix #1).
create or replace function public.apply_inventory_count(p_count_id uuid)
 returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare _t uuid := current_tenant(); _num text; _l record;
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  select count_number into _num from public.inventory_counts where id=p_count_id and tenant_id=_t and status='approved';
  if _num is null then raise exception 'Conteo no aprobado'; end if;
  for _l in select id, item_id, counted_qty, expected_qty from public.inventory_count_lines
    where count_id=p_count_id and line_status='approved' and counted_qty is not null and counted_qty <> expected_qty loop
    perform public.record_adjustment(_l.item_id, _l.counted_qty, 'Conteo cíclico ' || _num || ': ' || _l.expected_qty || ' → ' || _l.counted_qty);
    update public.inventory_count_lines set line_status='applied' where id=_l.id;
  end loop;
  update public.inventory_counts set status='applied', applied_at=now() where id=p_count_id;
  return p_count_id;
end $function$;
