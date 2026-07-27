import type { DriverStop } from "@operations/infrastructure/driver.repository";

const isDone = (s: string) => s.startsWith("Completad");

// Lista de paradas del día (driver-view). Resalta la parada activa; completadas muestran la hora.
export function DriverStopList({ stops, nextId }: { stops: DriverStop[]; nextId?: string }) {
  return (
    <div className="space-y-1.5">
      {stops.map((s) => (
        <div key={s.id} className={`flex items-center gap-2 rounded-lg border border-border p-3 ${s.id === nextId ? "bg-primary/5" : ""}`}>
          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
            isDone(s.status) ? "bg-green-500/10 text-green-600" : s.id === nextId ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{s.order}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{s.address || "—"}</p>
            <p className="truncate text-xs text-muted-foreground">{s.clientName || s.serviceType}</p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{isDone(s.status) && s.completedAt ? s.completedAt.slice(11, 16) : s.status}</span>
        </div>
      ))}
    </div>
  );
}
