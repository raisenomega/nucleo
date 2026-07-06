// BC admin — documentos + certificaciones del expediente. Puro.
import type { RepoResult } from "@admin/domain/admin.types";

export type DocType = "i9" | "w4" | "contract" | "medical_cert" | "background_check" | "drug_test"
  | "id_photo" | "ss_card" | "education" | "certification" | "reference" | "nda" | "other";

export interface EmployeeDocument {
  readonly id: string; readonly docType: DocType; readonly fileName: string; readonly fileUrl: string;
  readonly documentDate: string | null; readonly notes: string; readonly createdAt: string;
}

export interface EmployeeCertification {
  readonly id: string; readonly certificationName: string; readonly certificationNumber: string;
  readonly issuedDate: string | null; readonly expirationDate: string | null; readonly status: string; readonly documentUrl: string;
}

export interface CertFormData {
  readonly certificationName: string; readonly certificationNumber: string;
  readonly issuedDate: string; readonly expirationDate: string; readonly status: string;
}

export interface IEmployeeDocsRepository {
  listDocs(profileId: string): Promise<readonly EmployeeDocument[]>;
  uploadDoc(profileId: string, tenantId: string, file: File, docType: DocType, date: string, notes: string): Promise<RepoResult>;
  removeDoc(id: string, fileUrl: string): Promise<RepoResult>;
  listCerts(profileId: string): Promise<readonly EmployeeCertification[]>;
  addCert(profileId: string, c: CertFormData): Promise<RepoResult>;
  updateCert(id: string, c: CertFormData): Promise<RepoResult>;
  removeCert(id: string): Promise<RepoResult>;
}
