import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useI18n } from "@shared/i18n";

export function CopyOrderDetailsButton({ text }: { text: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  async function copy(): Promise<void> {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* noop */ }
  }
  return (
    <button type="button" onClick={() => void copy()}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground">
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{t("opCopyDetails")}
    </button>
  );
}
