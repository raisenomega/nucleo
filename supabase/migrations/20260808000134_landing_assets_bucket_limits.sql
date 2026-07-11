-- Migración 134: límites explícitos del bucket landing-assets para hero con video (50MB + headroom) e imagen.
-- Antes: file_size_limit=null (hereda default del proyecto), allowed_mime_types=null (cualquier MIME).
update storage.buckets
  set file_size_limit = 52428800,               -- 50 MiB + headroom
      allowed_mime_types = array['image/*','video/*']
  where name = 'landing-assets';
