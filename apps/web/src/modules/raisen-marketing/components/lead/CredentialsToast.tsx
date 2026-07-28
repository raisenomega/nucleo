import { useState } from "react";
import { X, Unlock, Clipboard, Check } from "lucide-react";

const EMAIL = "demo@nucleo.com";
const PASS = "Demo12345";

// Toast persistente (solo cierra con X) que sube desde abajo en la esquina inferior derecha,
// con las credenciales de acceso. Aparece al enviar el formulario, sin tocar el flujo inline existente.
export function CredentialsToast({ visible, onClose, es }: { visible: boolean; onClose: () => void; es: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(`${EMAIL} / ${PASS}`); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* noop */ }
  };
  return (
    <div className={`fixed bottom-4 right-4 z-[60] max-w-sm rounded-lg border border-border bg-card p-4 text-foreground shadow-xl transition-all duration-300 ease-out ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"}`}>
      <button type="button" onClick={onClose} aria-label="close" className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      <div className="mb-3 flex items-center gap-2 pr-4">
        <Unlock className="h-4 w-4 text-amber-500" /><span className="font-semibold">{es ? "Tus credenciales" : "Your credentials"}</span>
      </div>
      <div className="mb-3 space-y-1 text-sm">
        <div>Email: <code className="text-amber-500">{EMAIL}</code></div>
        <div>Password: <code className="text-amber-500">{PASS}</code></div>
      </div>
      <button type="button" onClick={() => void copy()} className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-1 text-xs font-bold text-foreground hover:opacity-80">
        {copied ? <Check className="h-3 w-3" /> : <Clipboard className="h-3 w-3" />} {es ? (copied ? "¡Copiado!" : "Copiar credenciales") : (copied ? "Copied!" : "Copy credentials")}
      </button>
    </div>
  );
}
