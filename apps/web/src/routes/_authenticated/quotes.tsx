import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useQuotes } from "@quotes/application/useQuotes.hook";
import { supabaseQuoteRepository } from "@quotes/infrastructure/supabase-quote.repository";
import { QuoteForm } from "@quotes/presentation/QuoteForm";
import { QuoteTable } from "@quotes/presentation/QuoteTable";
import { QuoteDetail } from "@quotes/presentation/QuoteDetail";
import { QuoteKpis } from "@quotes/presentation/QuoteKpis";
import type { Quote, QuoteStatus } from "@quotes/domain/quote.types";

export const Route = createFileRoute("/_authenticated/quotes")({ component: QuotesPage });

function QuotesPage() {
  const { t } = useI18n(); const { can } = useModuleAccess();
  const m = useQuotes(supabaseQuoteRepository);
  const [creating, setCreating] = useState(false); const [viewing, setViewing] = useState<Quote | null>(null);
  const [editing, setEditing] = useState<Quote | null>(null);
  if (!can("quotes", "view")) return <Navigate to="/dashboard" />;
  const onStatus = (s: QuoteStatus) => { if (viewing) { void m.setStatus(viewing.id, s); setViewing(null); } };
  const onConvert = () => { if (viewing) { void m.convert(viewing.id).then((inv) => { if (inv) window.alert(t("invoiceSaved")); }); setViewing(null); } };
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-xl font-bold text-primary md:text-3xl">{t("quotes")}</h1>
          {can("quotes", "create") && <button type="button" onClick={() => setCreating((v) => !v)}
            className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-bold"><Plus className="h-4 w-4" /> {t("newQuote")}</button>}
        </div>
        <p className="text-xs text-muted-foreground">{t("quotesSubtitle")}</p>
      </div>
      <QuoteKpis s={m.summary} />
      {(creating || editing) && <QuoteForm initial={editing ?? undefined}
        onSubmit={editing ? (d) => m.update(editing.id, d) : m.save}
        onCancel={() => { setCreating(false); setEditing(null); }} />}
      <QuoteTable rows={m.list} onView={setViewing} />
      {viewing && <QuoteDetail quote={viewing} canManage={can("quotes", "edit")} onStatus={onStatus} onConvert={onConvert}
        onEdit={() => { setEditing(viewing); setViewing(null); }} onClose={() => setViewing(null)} />}
    </div>
  );
}
