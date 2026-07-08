import { CheckCircle2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";

// Sección 3 — plantillas PDF disponibles (informativo v1; estilos elegibles en el futuro).
const TEMPLATES: { key: TranslationKey; desc: string }[] = [
  { key: "invoice", desc: "Cliente + items + totales + watermark de estado" },
  { key: "quotes", desc: "Items + válida hasta + términos + sello aceptada" },
  { key: "payroll", desc: "Recibo: bruto, deducciones, neto + aportes patronales" },
  { key: "evaluations", desc: "Scores por criterio + clasificación + aviso Ley 80" },
  { key: "reports", desc: "KPIs + tablas del pilar activo por rango" },
  { key: "fiscalReport", desc: "Resumen ejecutivo + banco + retención del mes" },
];

export function AdminTemplatesInfo() {
  const { t } = useI18n();
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5">
      <h3 className="font-body font-bold text-primary">{t("templatesSection")}</h3>
      <ul className="space-y-2">
        {TEMPLATES.map((x) => (
          <li key={x.key} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            <span><span className="font-semibold">{t(x.key)}</span>
              <span className="text-muted-foreground"> — {x.desc}</span></span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">{t("templatesFuture")}</p>
    </div>
  );
}
