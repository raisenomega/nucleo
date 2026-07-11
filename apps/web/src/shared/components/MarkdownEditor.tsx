import ReactMarkdown from "react-markdown";
import { useI18n } from "@shared/i18n";

// Editor split: textarea (markdown) izquierda + preview react-markdown derecha.
export function MarkdownEditor({ value, onChange, minHeight, placeholder }: {
  value: string; onChange: (v: string) => void; minHeight?: number; placeholder?: string;
}) {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder ?? t("description")}
        style={{ minHeight: minHeight ?? 160 }}
        className="w-full rounded-lg border border-border bg-background p-2 font-mono text-xs" />
      <div className="prose prose-sm max-w-none overflow-y-auto rounded-lg border border-border bg-secondary p-2 text-sm"
        style={{ minHeight: minHeight ?? 160 }}>
        <ReactMarkdown>{value || `_${t("preview")}_`}</ReactMarkdown>
      </div>
    </div>
  );
}
