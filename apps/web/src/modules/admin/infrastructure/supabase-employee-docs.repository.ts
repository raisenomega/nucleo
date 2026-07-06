import { supabase } from "@shared/lib/supabase";
import { uploadEmployeeDoc, removeEmployeeDoc } from "@admin/infrastructure/supabase-employee-docs.storage";
import type {
  EmployeeDocument, EmployeeCertification, DocType, CertFormData, IEmployeeDocsRepository,
} from "@admin/domain/employee-document.types";
import type { RepoResult } from "@admin/domain/admin.types";

const ok = (e: { message: string } | null): RepoResult => (e ? { ok: false, error: e.message } : { ok: true });
const certRow = (c: CertFormData) => ({ certification_name: c.certificationName, certification_number: c.certificationNumber,
  issued_date: c.issuedDate || null, expiration_date: c.expirationDate || null, status: c.status });

export const supabaseEmployeeDocsRepository: IEmployeeDocsRepository = {
  async listDocs(profileId): Promise<readonly EmployeeDocument[]> {
    const { data } = await supabase.from("employee_documents").select("id,doc_type,file_name,file_url,document_date,notes,created_at")
      .eq("profile_id", profileId).order("created_at", { ascending: false });
    return ((data as { id: string; doc_type: DocType; file_name: string; file_url: string; document_date: string | null; notes: string | null; created_at: string }[] | null) ?? [])
      .map((d) => ({ id: d.id, docType: d.doc_type, fileName: d.file_name, fileUrl: d.file_url, documentDate: d.document_date, notes: d.notes ?? "", createdAt: d.created_at }));
  },
  async uploadDoc(profileId, tenantId, file, docType, date, notes): Promise<RepoResult> {
    const path = await uploadEmployeeDoc(tenantId, file);
    if (!path) return { ok: false, error: "upload" };
    return ok((await supabase.from("employee_documents").insert({ profile_id: profileId, doc_type: docType,
      file_name: file.name, file_url: path, document_date: date || null, notes })).error);
  },
  async removeDoc(id, fileUrl): Promise<RepoResult> {
    await removeEmployeeDoc(fileUrl);
    return ok((await supabase.from("employee_documents").delete().eq("id", id)).error);
  },
  async listCerts(profileId): Promise<readonly EmployeeCertification[]> {
    const { data } = await supabase.from("employee_certifications").select("id,certification_name,certification_number,issued_date,expiration_date,status,document_url")
      .eq("profile_id", profileId).order("expiration_date");
    return ((data as { id: string; certification_name: string; certification_number: string | null; issued_date: string | null; expiration_date: string | null; status: string; document_url: string | null }[] | null) ?? [])
      .map((c) => ({ id: c.id, certificationName: c.certification_name, certificationNumber: c.certification_number ?? "", issuedDate: c.issued_date, expirationDate: c.expiration_date, status: c.status, documentUrl: c.document_url ?? "" }));
  },
  async addCert(profileId, c): Promise<RepoResult> {
    return ok((await supabase.from("employee_certifications").insert({ profile_id: profileId, ...certRow(c) })).error);
  },
  async updateCert(id, c): Promise<RepoResult> {
    return ok((await supabase.from("employee_certifications").update(certRow(c)).eq("id", id)).error);
  },
  async removeCert(id): Promise<RepoResult> {
    return ok((await supabase.from("employee_certifications").delete().eq("id", id)).error);
  },
};
