import { useState } from "react";
import { X } from "lucide-react";
import { useToast } from "@shared/providers/toast-context";
import { ScreenModal } from "@shared/components/ScreenModal";
import { formatCurrency } from "@shared/lib/format";
import { parseCsv, type ParsedCsv } from "@shared/lib/csv";
import { guessMap, mapRows } from "@finance/domain/bank-statement.map";
import { supabaseBankStatementRepository as repo } from "@finance/infrastructure/supabase-bank-statement.repository";
import { BankColumnMapper } from "@finance/presentation/BankColumnMapper";
import type { ColumnMap } from "@finance/domain/bank-statement.types";
import type { BankAccount } from "@finance/domain/bank-account.types";

// Import en 3 pasos (subir → mapear → preview). El parsing es 100% cliente; la RPC recibe líneas estructuradas.
export function BankImportWizard({ accounts, onClose, onDone }: {
  accounts: readonly BankAccount[]; onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [acct, setAcct] = useState(accounts.length === 1 ? (accounts[0]?.id ?? "") : "");
  const [fileName, setFileName] = useState("");
  const [csv, setCsv] = useState<ParsedCsv | null>(null);
  const [map, setMap] = useState<ColumnMap | null>(null);
  const [busy, setBusy] = useState(false);
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "text-xs font-bold text-muted-foreground";

  async function onFile(file: File) {
    const parsed = parseCsv(await file.text());
    if (!parsed.rows.length) { toast.error("CSV vacío o inválido"); return; }
    setFileName(file.name); setCsv(parsed);
    setMap((acct ? await repo.lastColumnMap(acct) : null) ?? guessMap(parsed.headers)); setStep(2);
  }
  const lines = csv && map ? mapRows(csv, map) : [];
  const credits = lines.filter((l) => l.amount > 0).reduce((s, l) => s + l.amount, 0);
  const debits = lines.filter((l) => l.amount < 0).reduce((s, l) => s + l.amount, 0);
  async function doImport() {
    if (!map) return;
    setBusy(true); const r = await repo.importStatement(acct, fileName, map, lines); setBusy(false);
    if (!r.ok) { toast.error(r.error); return; }
    toast.success(`${r.result.inserted} líneas importadas${r.result.skippedDuplicates ? `, ${r.result.skippedDuplicates} duplicadas omitidas` : ""}`);
    onDone(); onClose();
  }
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">Importar estado de cuenta · Paso {step}/3</h2>
        <button type="button" onClick={onClose} aria-label="Cerrar"><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-4 p-4 md:p-6">
        {step === 1 && (<>
          <label className="block space-y-1"><span className={lbl}>Cuenta bancaria</span>
            <select value={acct} onChange={(e) => setAcct(e.target.value)} className={fld}><option value="">—</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.bankName}</option>)}</select></label>
          <label className="block space-y-1"><span className={lbl}>Archivo CSV</span>
            <input type="file" accept=".csv,text/csv" disabled={!acct} onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); }} className={fld} /></label>
          {!acct && <p className="text-xs text-muted-foreground">Elegí una cuenta primero.</p>}
        </>)}
        {step === 2 && csv && map && (<>
          <BankColumnMapper headers={csv.headers} sample={csv.rows[0] ?? []} map={map} onChange={setMap} />
          <div className="flex gap-2"><button type="button" onClick={() => setStep(1)} className="rounded-lg bg-secondary px-4 py-2 text-sm">Atrás</button><button type="button" onClick={() => setStep(3)} className="flex-1 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold">Ver preview ({lines.length})</button></div>
        </>)}
        {step === 3 && (<>
          <div className="flex flex-wrap gap-3 text-sm"><span>{lines.length} líneas</span><span className="text-green-600">Créditos {formatCurrency(credits)}</span><span className="text-red-600">Débitos {formatCurrency(debits)}</span></div>
          <div className="max-h-64 overflow-auto rounded-lg border border-border"><table className="w-full text-xs">
            <thead className="sticky top-0 bg-secondary text-[10px] uppercase text-muted-foreground"><tr><th className="px-2 py-1 text-left">Fecha</th><th className="px-2 py-1 text-left">Descripción</th><th className="px-2 py-1 text-right">Monto</th></tr></thead>
            <tbody>{lines.slice(0, 100).map((l, i) => (<tr key={i} className="border-t border-border">
              <td className="px-2 py-1 text-muted-foreground">{l.txn_date}</td><td className="px-2 py-1">{l.description}</td>
              <td className={`px-2 py-1 text-right font-semibold ${l.amount < 0 ? "text-red-600" : "text-green-600"}`}>{formatCurrency(l.amount)}</td></tr>))}</tbody>
          </table></div>
          <div className="flex gap-2"><button type="button" onClick={() => setStep(2)} className="rounded-lg bg-secondary px-4 py-2 text-sm">Atrás</button><button type="button" disabled={busy || !lines.length} onClick={() => void doImport()} className="flex-1 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-50">{busy ? "Importando…" : `Importar ${lines.length}`}</button></div>
        </>)}
      </div>
    </ScreenModal>
  );
}
