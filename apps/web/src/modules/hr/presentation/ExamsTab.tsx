import { useState } from "react";
import { Plus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useExams } from "@hr/application/useExams.hook";
import { supabaseScreeningRepository } from "@hr/infrastructure/supabase-screening.repository";
import { ExamsTable } from "@hr/presentation/ExamsTable";
import { ExamFormModal } from "@hr/presentation/ExamFormModal";
import type { RecruitmentExam } from "@hr/domain/screening.types";

// Tab de exámenes en /recruitment. Autocontenido (hook + tabla + modal).
export function ExamsTab() {
  const { t } = useI18n();
  const m = useExams(supabaseScreeningRepository);
  const [modal, setModal] = useState<{ open: boolean; editing?: RecruitmentExam }>({ open: false });
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button type="button" onClick={() => setModal({ open: true })}
          className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground">
          <Plus className="h-4 w-4" /> {t("createExam")}</button>
      </div>
      <ExamsTable rows={m.exams} onEdit={(e) => setModal({ open: true, editing: e })} />
      {modal.open && <ExamFormModal initial={modal.editing}
        onSubmit={(d) => (modal.editing ? m.updateExam(modal.editing.id, d) : m.createExam(d))} onClose={() => setModal({ open: false })} />}
    </div>
  );
}
