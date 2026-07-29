import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Star, CreditCard } from "lucide-react";
import { useToast } from "@shared/providers/toast-context";
import { paymentMethodsRepository as repo } from "@landing/infrastructure/payment-methods.repository";
import type { PaymentMethod, PaymentMethodDraft } from "@landing/domain/payment-method.types";
import { PaymentMethodDialog } from "@landing/presentation/PaymentMethodDialog";

// Editor de métodos de pago del tenant (settings). CRUD de métodos MANUALES + toggle + default + reorder.
// Si el tenant tiene Stripe conectado se muestra como método PRINCIPAL (⭐); se gestiona en Ajustes → Stripe.
export function PaymentMethodsSection() {
  const toast = useToast();
  const [items, setItems] = useState<PaymentMethod[]>([]);
  const [stripeOn, setStripeOn] = useState(false);
  const [edit, setEdit] = useState<{ open: boolean; initial: PaymentMethod | null }>({ open: false, initial: null });
  const reload = () => void repo.list().then(setItems);
  useEffect(() => { reload(); void repo.stripeEnabled().then(setStripeOn); }, []);
  const done = (e: string | null) => { if (e) toast.error(e); else reload(); };
  const onSave = async (d: PaymentMethodDraft) => { const e = await repo.save(d); if (e) return toast.error(e); setEdit({ open: false, initial: null }); toast.success("Guardado"); reload(); };
  const move = async (i: number, dir: -1 | 1) => {
    const a = items[i], b = items[i + dir]; if (!a || !b) return;
    await repo.setFields(a.id, { display_order: b.display_order }); done(await repo.setFields(b.id, { display_order: a.display_order }));
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground">Métodos de pago ({items.length})</h2>
        <button type="button" onClick={() => setEdit({ open: true, initial: null })} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />Nuevo</button>
      </div>
      {stripeOn && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 p-3">
          <CreditCard className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Stripe (tarjeta) <Star className="ml-1 inline h-3 w-3 fill-primary text-primary" /></p>
            <p className="text-xs text-muted-foreground">Cobro automático con tarjeta de crédito/débito · gestiónalo en Ajustes → Stripe</p>
          </div>
        </div>
      )}
      {items.map((m, i) => (
        <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{m.display_name?.es ?? m.method_key}{m.is_default && <Star className="ml-1 inline h-3 w-3 fill-primary text-primary" />}</p>
            <p className="text-xs text-muted-foreground">{m.method_key}</p>
          </div>
          <button type="button" onClick={() => void move(i, -1)} disabled={i === 0} aria-label="subir" className="rounded p-1 text-muted-foreground disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
          <button type="button" onClick={() => void move(i, 1)} disabled={i === items.length - 1} aria-label="bajar" className="rounded p-1 text-muted-foreground disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
          <button type="button" onClick={() => void repo.setDefault(m.id).then(done)} aria-label="predeterminado" className="rounded p-1 text-muted-foreground hover:text-primary"><Star className={`h-4 w-4 ${m.is_default ? "fill-primary text-primary" : ""}`} /></button>
          <label className="flex items-center gap-1 text-xs text-muted-foreground"><input type="checkbox" checked={m.is_active} onChange={(e) => void repo.setFields(m.id, { is_active: e.target.checked }).then(done)} />activo</label>
          <button type="button" onClick={() => setEdit({ open: true, initial: m })} aria-label="editar" className="rounded p-1 text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
          <button type="button" onClick={() => { if (window.confirm(`¿Eliminar "${m.display_name?.es ?? m.method_key}"?`)) void repo.remove(m.id).then(done); }} aria-label="eliminar" className="rounded p-1 text-destructive"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      {edit.open && <PaymentMethodDialog initial={edit.initial} onClose={() => setEdit({ open: false, initial: null })} onSave={onSave} />}
    </div>
  );
}
