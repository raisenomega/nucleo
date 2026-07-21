import { useEffect, useState } from "react";
import { Eye, EyeOff, Pencil, Check, X } from "lucide-react";
import { useToast } from "@shared/providers/toast-context";
import { ssnRepository as repo } from "@admin/infrastructure/supabase-ssn.repository";

const RE = /^\d{3}-\d{2}-\d{4}$/;

// Campo SSN cifrado. Por defecto muestra los últimos 4 ('•••-••-1234'); "revelar" trae el completo INLINE por
// RPC (queda auditado); "editar" guarda por RPC. El SSN nunca vive en el form general — no cruza el upsert de
// la tabla employee_details. La tabla employee_ssn es deny-all: el bytea cifrado jamás llega al cliente.
export function SsnField({ profileId, label }: { profileId: string; label: string }) {
  const toast = useToast();
  const [masked, setMasked] = useState<string | null>(null);
  const [full, setFull] = useState<string | null>(null); // completo revelado (en memoria, no persiste)
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const load = () => void repo.last4(profileId).then(setMasked);

  useEffect(load, [profileId]);
  const reveal = async () => { if (full) return setFull(null); setFull(await repo.reveal(profileId)); };
  const save = async () => {
    if (draft && !RE.test(draft)) return toast.error("Formato inválido (NNN-NN-NNNN)");
    const r = await repo.save(profileId, draft);
    if (!r.ok) return toast.error(r.error);
    setEditing(false); setDraft(""); setFull(null); load(); toast.success("SSN guardado");
  };

  return (
    <label className="space-y-1">
      <span className="text-xs font-bold text-muted-foreground">{label}</span>
      {editing ? (
        <div className="flex gap-1">
          <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="123-45-6789 (vacío para borrar)" className={fld} />
          <button type="button" onClick={() => void save()} aria-label="Guardar" className="rounded-lg bg-primary px-2 text-primary-foreground"><Check className="h-4 w-4" /></button>
          <button type="button" onClick={() => { setEditing(false); setDraft(""); }} aria-label="Cancelar" className="rounded-lg bg-secondary px-2"><X className="h-4 w-4" /></button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <span className={`${fld} flex items-center ${full ? "text-foreground" : "text-muted-foreground"}`}>{full ?? masked ?? "No registrado"}</span>
          {masked && <button type="button" onClick={() => void reveal()} aria-label={full ? "Ocultar" : "Revelar"} className="rounded-lg bg-secondary px-2 py-2">{full ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>}
          <button type="button" onClick={() => setEditing(true)} aria-label="Editar" className="rounded-lg bg-secondary px-2 py-2"><Pencil className="h-4 w-4" /></button>
        </div>
      )}
    </label>
  );
}
