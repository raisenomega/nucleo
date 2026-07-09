import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { supabase } from "@shared/lib/supabase";

type Pending = { email: string; full_name: string; role: string; created_at: string };

// Invitaciones creadas (allowed_emails) que aún no se registraron (no tienen profile).
// Lee directo (patrón TeamList/employee_documents). refreshKey fuerza recarga tras invitar.
export function PendingInvites({ refreshKey }: { refreshKey: number }) {
  const { t } = useI18n();
  const toast = useToast();
  const [rows, setRows] = useState<Pending[]>([]);
  const load = useCallback(async () => {
    const [a, p] = await Promise.all([
      supabase.from("allowed_emails").select("email,full_name,role,created_at"),
      supabase.from("profiles").select("email"),
    ]);
    const reg = new Set(((p.data as { email: string }[] | null) ?? []).map((x) => x.email.toLowerCase()));
    setRows(((a.data as Pending[] | null) ?? []).filter((x) => !reg.has(x.email.toLowerCase())));
  }, []);
  useEffect(() => { void load(); }, [load, refreshKey]);
  const cancel = async (email: string) => {
    const { error } = await supabase.from("allowed_emails").delete().eq("email", email);
    if (error) return toast.error(error.message);
    toast.success(t("inviteCanceled"));
    void load();
  };
  if (rows.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-2 text-sm font-bold text-muted-foreground">{t("pendingInvites")}</h3>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.email} className="flex items-center justify-between gap-2 text-sm">
            <span>{r.full_name} · {r.email} · <span className="text-primary">{r.role}</span> · <span className="text-muted-foreground">{t("invited")}</span></span>
            <button type="button" onClick={() => void cancel(r.email)} aria-label={t("cancelInvite")} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}
