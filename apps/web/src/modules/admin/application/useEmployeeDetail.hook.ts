import { useCallback, useEffect, useState } from "react";
import type { EmployeeDetail, EmployeeDetailUpdate, IEmployeeDetailRepository } from "@admin/domain/employee-detail.types";
import type {
  EmployeeDocument, EmployeeCertification, DocType, CertFormData, IEmployeeDocsRepository,
} from "@admin/domain/employee-document.types";

// DI de 2 repos. Carga detail + docs + certs del empleado; expone handlers que refrescan.
export function useEmployeeDetail(detailRepo: IEmployeeDetailRepository, docsRepo: IEmployeeDocsRepository, profileId: string) {
  const [detail, setDetail] = useState<EmployeeDetail | null>(null);
  const [docs, setDocs] = useState<EmployeeDocument[]>([]);
  const [certs, setCerts] = useState<EmployeeCertification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [d, dl, cl] = await Promise.all([detailRepo.get(profileId), docsRepo.listDocs(profileId), docsRepo.listCerts(profileId)]);
    setDetail(d); setDocs([...dl]); setCerts([...cl]); setLoading(false);
  }, [detailRepo, docsRepo, profileId]);
  useEffect(() => { void refresh(); }, [refresh]);

  const saveDetail = useCallback(async (d: EmployeeDetailUpdate) => { const r = await detailRepo.upsert(profileId, d); if (r.ok) await refresh(); return r; }, [detailRepo, profileId, refresh]);
  const uploadDoc = useCallback(async (tenantId: string, file: File, docType: DocType, date: string, notes: string) => { const r = await docsRepo.uploadDoc(profileId, tenantId, file, docType, date, notes); if (r.ok) await refresh(); return r; }, [docsRepo, profileId, refresh]);
  const removeDoc = useCallback(async (id: string, url: string) => { const r = await docsRepo.removeDoc(id, url); if (r.ok) await refresh(); return r; }, [docsRepo, refresh]);
  const addCert = useCallback(async (c: CertFormData) => { const r = await docsRepo.addCert(profileId, c); if (r.ok) await refresh(); return r; }, [docsRepo, profileId, refresh]);
  const updateCert = useCallback(async (id: string, c: CertFormData) => { const r = await docsRepo.updateCert(id, c); if (r.ok) await refresh(); return r; }, [docsRepo, refresh]);
  const removeCert = useCallback(async (id: string) => { const r = await docsRepo.removeCert(id); if (r.ok) await refresh(); return r; }, [docsRepo, refresh]);

  return { detail, docs, certs, loading, saveDetail, uploadDoc, removeDoc, addCert, updateCert, removeCert };
}
