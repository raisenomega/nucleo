import { useState, type ReactNode } from "react";
import { DemoAccessModal } from "@shared/components/DemoAccessModal";

// Botón "Probar demo" + modal de acceso. Reutilizable en la landing comercial y las campañas.
export function DemoTrigger({ lang, className, children }: { lang: "es" | "en"; className: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>{children}</button>
      {open && <DemoAccessModal lang={lang} onClose={() => setOpen(false)} />}
    </>
  );
}
