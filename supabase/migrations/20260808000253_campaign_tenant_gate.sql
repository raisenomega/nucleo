-- =============================================
-- LANDING PAGES DE CAMPAÑA — R5: acceso tenant (defensa en profundidad del gate)
-- El gate de UI para el tenant es landing_enabled + isCeo (igual que la sección LANDING del sidebar). Acá se
-- ENDURECE _campaign_can_manage para que la rama tenant también exija landing_enabled (no solo settings:edit):
-- así un CEO con landing_enabled=false no puede crear/editar campañas ni por API. El sentinela (superadmin) NO
-- se toca — el sentinela tiene landing_enabled=false por diseño y su rama es is_superadmin().
-- =============================================

create or replace function public._campaign_can_manage(_tenant uuid)
 returns boolean language sql stable set search_path to 'public' as $$
  select (_tenant = '00000000-0000-0000-0000-0000000000a1' and public.is_superadmin())
      or (_tenant is not distinct from public.current_tenant() and public.can_access_module('settings','edit')
          and coalesce((select t.landing_enabled from public.tenants t where t.id = _tenant), false));
$$;
