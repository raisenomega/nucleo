import { useEffect, useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { useToast } from "@shared/providers/toast-context";
import { useSuperAdmin } from "@shared/hooks/useSuperAdmin";
import { getAvailabilityConfig, saveAvailabilityConfig, getBlockedDates, addBlockedDate, deleteBlockedDate } from "@raisen-marketing/infrastructure/marketing-availability.repository";
import type { AvailabilityConfig, BlockedDate } from "@raisen-marketing/data/reservation.types";
import { BlockedDatesEditor } from "@raisen-marketing/admin/BlockedDatesEditor";

const F = "w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground";
const DAYS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

// Editor /web/disponibilidad: config del demo (tz, duración, buffer, máx/día, días hábiles, horario, textos) +
// fechas bloqueadas. Guarda config con botón; los bloqueos se agregan/quitan al instante. Gate is_superadmin.
export function AvailabilityManager() {
  const { isSuperAdmin } = useSuperAdmin();
  const toast = useToast();
  const [c, setC] = useState<AvailabilityConfig | null>(null);
  const [blocked, setBlocked] = useState<BlockedDate[]>([]);
  const reloadB = () => { void getBlockedDates().then(setBlocked); };
  useEffect(() => { void getAvailabilityConfig().then(setC); reloadB(); }, []);
  if (!isSuperAdmin) return <Navigate to="/dashboard" />;
  if (!c) return <div className="p-8 text-sm text-muted-foreground">Cargando…</div>;
  const set = (p: Partial<AvailabilityConfig>) => setC((x) => ({ ...x!, ...p }));
  const toggleDay = (d: number) => set({ availableDays: c.availableDays.includes(d) ? c.availableDays.filter((x) => x !== d) : [...c.availableDays, d].sort() });
  const save = async () => { const e = await saveAvailabilityConfig(c); if (e) toast.error(e); else toast.success("Guardado"); };
  const num = (v: string) => Number(v);
  return (
    <div className="max-w-2xl space-y-4 p-4 md:p-8">
      <h1 className="font-display text-2xl font-bold text-foreground">Editor · Disponibilidad</h1>
      <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-4">
        <label className="text-xs text-muted-foreground">Duración<select className={F} value={c.durationMinutes} onChange={(e) => set({ durationMinutes: num(e.target.value) })}>{[15, 30, 45, 60].map((n) => <option key={n} value={n}>{n} min</option>)}</select></label>
        <label className="text-xs text-muted-foreground">Buffer<select className={F} value={c.bufferMinutes} onChange={(e) => set({ bufferMinutes: num(e.target.value) })}>{[0, 5, 10, 15].map((n) => <option key={n} value={n}>{n} min</option>)}</select></label>
        <label className="text-xs text-muted-foreground">Máx/día<input type="number" className={F} value={c.maxPerDay} onChange={(e) => set({ maxPerDay: num(e.target.value) })} /></label>
        <label className="text-xs text-muted-foreground">Zona<input className={F} value={c.timezone} onChange={(e) => set({ timezone: e.target.value })} /></label>
      </div>
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap gap-2">{DAYS.map((d, i) => <button key={i} type="button" onClick={() => toggleDay(i)} className={`rounded-md border px-3 py-1.5 text-xs ${c.availableDays.includes(i) ? "border-primary bg-primary/10 text-primary" : "border-input text-muted-foreground"}`}>{d}</button>)}</div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-muted-foreground">Desde<input type="time" className={F} value={c.hoursStart} onChange={(e) => set({ hoursStart: e.target.value })} /></label>
          <label className="text-xs text-muted-foreground">Hasta<input type="time" className={F} value={c.hoursEnd} onChange={(e) => set({ hoursEnd: e.target.value })} /></label>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-4">
        <input className={F} placeholder="Título ES" value={c.titleEs} onChange={(e) => set({ titleEs: e.target.value })} />
        <input className={F} placeholder="Título EN" value={c.titleEn} onChange={(e) => set({ titleEn: e.target.value })} />
        <input className={F} placeholder="Subtítulo ES" value={c.subtitleEs} onChange={(e) => set({ subtitleEs: e.target.value })} />
        <input className={F} placeholder="Subtítulo EN" value={c.subtitleEn} onChange={(e) => set({ subtitleEn: e.target.value })} />
        <input className={F} placeholder="Msg éxito pantalla ES" value={c.confirmEs} onChange={(e) => set({ confirmEs: e.target.value })} />
        <input className={F} placeholder="Msg éxito pantalla EN" value={c.confirmEn} onChange={(e) => set({ confirmEn: e.target.value })} />
        <input className={F} placeholder="Email confirmación asunto ES" value={c.confSubjectEs} onChange={(e) => set({ confSubjectEs: e.target.value })} />
        <input className={F} placeholder="Email confirmación asunto EN" value={c.confSubjectEn} onChange={(e) => set({ confSubjectEn: e.target.value })} />
        <input className={F} placeholder="Email confirmación cuerpo ES" value={c.confBodyEs} onChange={(e) => set({ confBodyEs: e.target.value })} />
        <input className={F} placeholder="Email confirmación cuerpo EN" value={c.confBodyEn} onChange={(e) => set({ confBodyEn: e.target.value })} />
      </div>
      <button type="button" onClick={() => void save()} className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-primary-foreground">Guardar configuración</button>
      <BlockedDatesEditor blocked={blocked} onAdd={(d, r) => void addBlockedDate(d, r).then((e) => e ? toast.error(e) : reloadB())} onRemove={(id) => void deleteBlockedDate(id).then((e) => e ? toast.error(e) : reloadB())} />
    </div>
  );
}
