import { useCallback, useEffect, useState } from "react";
import type { IDocumentRepository, Doc, DocInput, DocStatus, ExpiringDoc } from "@documents/domain/document.types";

export function useDocuments(repo: IDocumentRepository) {
  const [list, setList] = useState<Doc[]>([]);
  const [expiring, setExpiring] = useState<ExpiringDoc[]>([]);
  const load = useCallback(async () => {
    const [l, e] = await Promise.all([repo.list(), repo.expiring(30)]);
    setList(l); setExpiring(e);
  }, [repo]);
  useEffect(() => { void load(); }, [load]);
  const save = useCallback(async (d: DocInput) => { const r = await repo.save(d); if (r.ok) await load(); return r; }, [repo, load]);
  const setStatus = useCallback(async (id: string, st: DocStatus, exp: string | null) => { const r = await repo.setStatus(id, st, exp); if (r.ok) await load(); return r; }, [repo, load]);
  const remove = useCallback(async (id: string) => { const r = await repo.remove(id); if (r.ok) await load(); return r; }, [repo, load]);
  return { list, expiring, save, setStatus, remove, upload: repo.upload, signedUrl: repo.signedUrl };
}
