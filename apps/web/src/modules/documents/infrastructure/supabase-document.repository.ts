import { supabase } from "@shared/lib/supabase";
import type { IDocumentRepository, Doc, DocInput, DocStatus, ExpiringDoc, DocResult } from "@documents/domain/document.types";

const BUCKET = "tenant-documents";
interface Row {
  id: string; title: string; doc_category: string; description: string | null; file_url: string; file_name: string;
  parties: string[] | null; effective_date: string | null; expiration_date: string | null;
  status: string; reminder_days: number; tags: string[] | null; created_at: string;
}
const SEL = "id,title,doc_category,description,file_url,file_name,parties,effective_date,expiration_date,status,reminder_days,tags,created_at";
const ok = (e: { message: string } | null): DocResult => (e ? { ok: false, error: e.message } : { ok: true });
const toDoc = (r: Row): Doc => ({
  id: r.id, title: r.title, category: r.doc_category as Doc["category"], description: r.description,
  fileUrl: r.file_url, fileName: r.file_name, parties: r.parties ?? [],
  effectiveDate: r.effective_date, expirationDate: r.expiration_date, status: r.status as DocStatus,
  reminderDays: r.reminder_days, tags: r.tags ?? [], createdAt: r.created_at,
});

export const supabaseDocumentRepository: IDocumentRepository = {
  async list(): Promise<Doc[]> {
    const { data } = await supabase.from("documents").select(SEL).order("created_at", { ascending: false });
    return ((data as Row[] | null) ?? []).map(toDoc);
  },
  async upload(tenantId, file): Promise<{ path: string; name: string } | null> {
    const clean = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${tenantId}/${crypto.randomUUID()}-${clean}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file);
    return error ? null : { path, name: file.name };
  },
  async signedUrl(path): Promise<string | null> {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  },
  async save(d: DocInput): Promise<DocResult> {
    return ok((await supabase.from("documents").insert({
      title: d.title, doc_category: d.category, description: d.description || null, file_url: d.fileUrl, file_name: d.fileName,
      parties: d.parties.length ? d.parties : null, effective_date: d.effectiveDate, expiration_date: d.expirationDate,
      reminder_days: d.reminderDays, tags: d.tags.length ? d.tags : null,
    })).error);
  },
  async setStatus(id, status: DocStatus, newExpiration): Promise<DocResult> {
    const patch: Record<string, unknown> = { status };
    if (newExpiration) patch.expiration_date = newExpiration;
    return ok((await supabase.from("documents").update(patch).eq("id", id)).error);
  },
  async remove(id): Promise<DocResult> { return ok((await supabase.from("documents").delete().eq("id", id)).error); },
  async expiring(days): Promise<ExpiringDoc[]> {
    const { data } = await supabase.rpc("get_expiring_documents", { days_ahead: days });
    return (data as ExpiringDoc[] | null) ?? [];
  },
};
