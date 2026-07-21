import { useEffect, useState } from "react";
import { MANUAL_METHODS, type PaymentMethod, type PaymentMethodDraft, type MethodKey } from "@landing/domain/payment-method.types";

const EMPTY: PaymentMethodDraft = { method_key: "ath_movil_manual", is_active: true, is_default: false, display_name: {}, config: {}, display_order: 99 };
const F = "w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground";
const LABEL: Record<string, string> = { ath_movil_manual: "ATH Móvil (manual)", cash_on_delivery: "Efectivo al recibir", bank_transfer: "Transferencia bancaria", offline_coordination: "Coordinar (WhatsApp)" };

// Modal crear/editar método de pago MANUAL. Los campos de config cambian según el method_key. El bytea de
// gateways no aplica aquí — solo texto. method_key es readonly al editar (cambia el contrato del checkout).
export function PaymentMethodDialog({ initial, onClose, onSave }: { initial: PaymentMethod | null; onClose: () => void; onSave: (d: PaymentMethodDraft) => void }) {
  const [d, setD] = useState<PaymentMethodDraft>(EMPTY);
  useEffect(() => setD(initial ?? EMPTY), [initial]);
  const set = (p: Partial<PaymentMethodDraft>) => setD((x) => ({ ...x, ...p }));
  const setCfg = (p: Partial<PaymentMethodDraft["config"]>) => setD((x) => ({ ...x, config: { ...x.config, ...p } }));
  const k = d.method_key;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-bold text-foreground">{d.id ? "Editar" : "Nuevo"} método de pago</h2>
        <label className="text-xs text-muted-foreground">Tipo
          <select className={F} disabled={!!d.id} value={k} onChange={(e) => set({ method_key: e.target.value as MethodKey })}>
            {MANUAL_METHODS.map((m) => <option key={m} value={m}>{LABEL[m]}</option>)}</select></label>
        <div className="grid grid-cols-2 gap-2">
          <input className={F} placeholder="Nombre visible ES" value={d.display_name.es ?? ""} onChange={(e) => set({ display_name: { ...d.display_name, es: e.target.value } })} />
          <input className={F} placeholder="Nombre visible EN" value={d.display_name.en ?? ""} onChange={(e) => set({ display_name: { ...d.display_name, en: e.target.value } })} />
        </div>
        {k === "ath_movil_manual" && <input className={F} placeholder="Número ATH Móvil" value={d.config.ath_number ?? ""} onChange={(e) => setCfg({ ath_number: e.target.value })} />}
        {k === "bank_transfer" && <textarea className={F} rows={2} placeholder="Detalles de cuenta (banco, número…)" value={d.config.account_details ?? ""} onChange={(e) => setCfg({ account_details: e.target.value })} />}
        {k !== "offline_coordination" && (
          <div className="grid grid-cols-2 gap-2">
            <textarea className={F} rows={3} placeholder="Instrucciones ES" value={d.config.instructions_es ?? ""} onChange={(e) => setCfg({ instructions_es: e.target.value })} />
            <textarea className={F} rows={3} placeholder="Instrucciones EN" value={d.config.instructions_en ?? ""} onChange={(e) => setCfg({ instructions_en: e.target.value })} />
          </div>)}
        <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={d.is_active} onChange={(e) => set({ is_active: e.target.checked })} />Activo</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => onSave(d)} className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground">Guardar</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm text-foreground">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
