import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Link2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { useRecruitment } from "@hr/application/useRecruitment.hook";
import { usePipeline } from "@hr/application/usePipeline.hook";
import { supabaseRecruitmentRepository } from "@hr/infrastructure/supabase-recruitment.repository";
import { ApplicantCard } from "@hr/presentation/ApplicantCard";
import { ApplicantDetail } from "@hr/presentation/ApplicantDetail";
import { STAGE_KEY } from "@hr/presentation/recruit-ui";
import { PIPELINE_STAGES, type Applicant } from "@hr/domain/recruitment.types";

export function PipelinePage({ openingId }: { openingId: string }) {
  const { t } = useI18n();
  const toast = useToast();
  const { openings } = useRecruitment(supabaseRecruitmentRepository);
  const p = usePipeline(supabaseRecruitmentRepository, openingId);
  const opening = openings.find((o) => o.id === openingId);
  const [detail, setDetail] = useState<Applicant | null>(null);
  const [showRej, setShowRej] = useState(false);
  const act = (pr: Promise<{ ok: boolean; error?: string }>) => void pr.then((r) => { if (!r.ok && r.error) toast.error(r.error); });
  const advance = (a: Applicant) => {
    const next = PIPELINE_STAGES[PIPELINE_STAGES.indexOf(a.stage) + 1];
    if (!next) return;
    if (next === "hired" && !window.confirm(t("confirmHire"))) return;
    setDetail(null);
    act(p.advance(a.id, next).then((r) => { if (r.ok && next === "hired") toast.success(t("applicantHired")); return r; }));
  };
  const reject = (a: Applicant) => { const reason = window.prompt(t("rejectReason")); if (reason === null) return; setDetail(null); act(p.reject(a.id, reason)); };
  const copy = async () => { if (opening) { await navigator.clipboard.writeText(`${window.location.origin}/apply/${opening.publicToken}`); toast.success(t("linkCopied")); } };
  const rejected = [...(p.byStage.rejected ?? []), ...(p.byStage.withdrawn ?? [])];
  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link to="/recruitment" className="text-xs text-muted-foreground hover:underline">← {t("recruitment")}</Link>
          <h1 className="font-display text-xl font-bold text-foreground">{opening?.positionTitle ?? t("pipeline")} <span className="font-mono text-sm text-muted-foreground">{opening?.openingNumber ?? ""}</span></h1>
        </div>
        {opening?.status === "published" && <button type="button" onClick={() => void copy()} className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-sm font-bold"><Link2 className="h-4 w-4" /> {t("copyLink")}</button>}
      </div>
      {p.loading ? <p className="text-sm text-muted-foreground">{t("noData")}</p> : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {PIPELINE_STAGES.map((stage) => (
            <div key={stage} className="w-56 shrink-0 space-y-2">
              <div className="flex items-center justify-between border-b border-border pb-1">
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t(STAGE_KEY[stage])}</span>
                <span className="text-xs text-muted-foreground">{(p.byStage[stage] ?? []).length}</span></div>
              {(p.byStage[stage] ?? []).map((a) => (
                <ApplicantCard key={a.id} a={a} isOffer={stage === "offer"} done={stage === "hired"}
                  onOpen={() => setDetail(a)} onAdvance={() => advance(a)} onReject={() => reject(a)} />))}
            </div>))}
        </div>)}
      {rejected.length > 0 && (
        <div><button type="button" onClick={() => setShowRej((v) => !v)} className="text-sm font-bold text-muted-foreground hover:text-foreground">{t("rejected")} ({rejected.length})</button>
          {showRej && <div className="mt-2 space-y-1">{rejected.map((a) => <div key={a.id} className="rounded border border-border p-2 text-sm text-muted-foreground">{a.fullName} — {a.email}</div>)}</div>}</div>)}
      {detail && <ApplicantDetail a={detail} onClose={() => setDetail(null)} onAdvance={() => advance(detail)} onReject={() => reject(detail)} />}
    </div>
  );
}
