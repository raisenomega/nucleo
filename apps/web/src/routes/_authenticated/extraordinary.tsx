import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useExtraordinary } from "@finance/application/useExtraordinary.hook";
import { supabaseExtraordinaryRepository } from "@finance/infrastructure/supabase-extraordinary.repository";
import { ExtraordinaryForm } from "@finance/presentation/ExtraordinaryForm";
import { ExtraordinaryTable } from "@finance/presentation/ExtraordinaryTable";
import { ExtraordinaryDetail } from "@finance/presentation/ExtraordinaryDetail";
import type { ExtraPaymentFormData } from "@finance/domain/extraordinary.types";

export const Route = createFileRoute("/_authenticated/extraordinary")({ component: ExtraordinaryPage });

type Cat = { id: string; label: string; kind: string };

function ExtraordinaryPage() {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const { items, create, update, remove } = useExtraordinary(supabaseExtraordinaryRepository);
  const [cats, setCats] = useState<Cat[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);

  useEffect(() => {
    void supabase.from("categories").select("id,label,kind").in("kind", ["extraordinary", "payment_method"])
      .then(({ data }) => setCats((data as Cat[] | null) ?? []));
  }, []);

  const editRow = useMemo<ExtraPaymentFormData | undefined>(() => {
    const i = items.find((x) => x.id === editing);
    return i ? { categoryId: i.categoryId, amount: i.amount, justification: i.justification,
      date: i.date, paymentMethodId: i.paymentMethodId, evidenceUrls: i.evidenceUrls } : undefined;
  }, [editing, items]);

  async function submit(d: ExtraPaymentFormData) {
    if (editing && editing !== "new") await update(editing, d); else await create(d);
    setEditing(null);
  }

  if (!can("extraordinary", "view")) return <Navigate to="/dashboard" />;
  const viewItem = items.find((i) => i.id === viewing);
  return (
    <div className="space-y-6 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">{t("extraordinary")}</h1>
          <p className="text-xs text-muted-foreground">{t("extraordinarySubtitle")}</p>
        </div>
        {can("extraordinary", "create") && (
          <button type="button" onClick={() => setEditing("new")}
            className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">
            <Plus className="h-4 w-4" /> {t("newExtraordinary")}
          </button>
        )}
      </div>
      {editing !== null && (
        <ExtraordinaryForm extraCats={cats.filter((c) => c.kind === "extraordinary")}
          payCats={cats.filter((c) => c.kind === "payment_method")}
          initial={editRow} onSubmit={submit} onCancel={() => setEditing(null)} />
      )}
      <ExtraordinaryTable rows={items} onView={setViewing} onEdit={can("extraordinary", "edit") ? setEditing : undefined}
        onDelete={can("extraordinary", "delete") ? (id) => { if (window.confirm(`${t("delete")}?`)) void remove(id); } : undefined} />
      {viewItem && <ExtraordinaryDetail item={viewItem} onClose={() => setViewing(null)} />}
    </div>
  );
}
