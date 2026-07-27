import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { useRecruitment } from "@hr/application/useRecruitment.hook";
import { supabaseRecruitmentRepository } from "@hr/infrastructure/supabase-recruitment.repository";
import { PositionsTable } from "@hr/presentation/PositionsTable";
import { OpeningsTable } from "@hr/presentation/OpeningsTable";
import { PositionFormModal } from "@hr/presentation/PositionFormModal";
import { OpeningFormModal } from "@hr/presentation/OpeningFormModal";
import { ExamsTab } from "@hr/presentation/ExamsTab";
import type { JobOpening, JobPosition } from "@hr/domain/recruitment.types";

export function RecruitmentPage() {
  const { t } = useI18n();
  const toast = useToast();
  const navigate = useNavigate();
  const m = useRecruitment(supabaseRecruitmentRepository);
  const [tab, setTab] = useState<"positions" | "openings" | "exams">("positions");
  const [pos, setPos] = useState<{ open: boolean; editing?: JobPosition }>({ open: false });
  const [op, setOp] = useState<{ open: boolean; preselect?: string }>({ open: false });
  const copy = async (o: JobOpening) => { await navigator.clipboard.writeText(`${window.location.origin}/apply/${o.publicToken}`); toast.success(t("linkCopied")); };
  const act = (p: Promise<{ ok: boolean; error?: string }>) => void p.then((r) => { if (!r.ok && r.error) toast.error(r.error); });
  const tabCls = (x: string) => `px-3 py-2 text-sm font-bold ${tab === x ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`;
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("recruitment")}</h1>
        {tab !== "exams" && <button type="button" onClick={() => (tab === "positions" ? setPos({ open: true }) : setOp({ open: true }))}
          className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground">
          <Plus className="h-4 w-4" /> {tab === "positions" ? t("createPosition") : t("createOpening")}</button>}
      </div>
      <div className="flex gap-2 border-b border-border">
        <button type="button" onClick={() => setTab("positions")} className={tabCls("positions")}>{t("jobPositions")}</button>
        <button type="button" onClick={() => setTab("openings")} className={tabCls("openings")}>{t("jobOpenings")}</button>
        <button type="button" onClick={() => setTab("exams")} className={tabCls("exams")}>{t("exams")}</button>
      </div>
      {tab === "exams" ? <ExamsTab /> : m.loading ? <p className="text-sm text-muted-foreground">{t("noData")}</p> : tab === "positions" ? (
        <PositionsTable rows={m.positions} onEdit={(p) => setPos({ open: true, editing: p })} onCreateOpening={(p) => setOp({ open: true, preselect: p.id })} />
      ) : (
        <OpeningsTable rows={m.openings} onPipeline={(o) => void navigate({ to: "/recruitment/pipeline", search: { opening: o.id } })}
          onPublish={(id) => act(m.publishOpening(id))} onPause={(id) => act(m.pauseOpening(id))} onClose={(id) => act(m.closeOpening(id))} onCopy={copy} />
      )}
      {pos.open && <PositionFormModal initial={pos.editing}
        onSubmit={(d) => (pos.editing ? m.updatePosition(pos.editing.id, d) : m.createPosition(d))} onClose={() => setPos({ open: false })} />}
      {op.open && <OpeningFormModal positions={m.positions} preselect={op.preselect} onSubmit={m.createOpening} onClose={() => setOp({ open: false })} />}
    </div>
  );
}
