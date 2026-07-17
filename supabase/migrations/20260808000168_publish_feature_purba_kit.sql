-- packages-visible — el paquete "Purba kit" estaba configurado en el admin pero no aparecía en el home ni en el
-- catálogo. Causa: datos, no código. El RPC _public_get_landing_home filtra featured_packages por
-- is_active AND is_published AND is_featured; el catálogo por is_active AND is_published. Purba kit tenía
-- is_active=true pero is_published=false e is_featured=false → invisible en ambos.
-- Fix: publicar + destacar. Solo dato, scoped al tenant, idempotente.

update public.tenant_landing_packages
set is_published = true, is_featured = true
where tenant_id = '61205cb9-1418-4bfa-a029-bbb44d4e4310'
  and slug = 'purba-kit';
