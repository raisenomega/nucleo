-- 212 · Logo/favicon del tenant: subir el tope de 500 KB a 3 MB. El límite real vivía SOLO en el frontend
-- (upload-brand-asset.ts); el bucket `brand` no tenía file_size_limit. Se fija a 3 MB para enforcement
-- también del lado servidor (defensa en profundidad: el front valida y Storage rechaza si se lo saltan).
update storage.buckets set file_size_limit = 3145728 where id = 'brand';
