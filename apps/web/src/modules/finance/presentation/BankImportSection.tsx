import { useState } from "react";
import { Upload } from "lucide-react";
import { BankImportWizard } from "@finance/presentation/BankImportWizard";
import { BankStatementLines } from "@finance/presentation/BankStatementLines";
import type { BankAccount } from "@finance/domain/bank-account.types";

// Ola 2.5a · sección de import de estado de cuenta en Conciliación (wizard + lista de líneas en staging).
export function BankImportSection({ accounts, canWrite }: { accounts: readonly BankAccount[]; canWrite: boolean }) {
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground">Estado de cuenta importado</h2>
        {canWrite && accounts.length > 0 && <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-bold"><Upload className="h-4 w-4" />Importar CSV</button>}
      </div>
      <BankStatementLines key={refreshKey} accounts={accounts} canDelete={canWrite} />
      {open && <BankImportWizard accounts={accounts} onClose={() => setOpen(false)} onDone={() => setRefreshKey((k) => k + 1)} />}
    </div>
  );
}
