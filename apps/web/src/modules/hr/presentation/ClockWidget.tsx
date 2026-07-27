import { useEffect, useState } from "react";
import { LogIn, LogOut, AlertTriangle } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { useAttendance } from "@hr/application/useAttendance.hook";
import { supabaseAttendanceRepository } from "@hr/infrastructure/supabase-attendance.repository";

// GPS best-effort: no bloquea el marcaje si falla o el usuario deniega.
const getPos = () => new Promise<{ lat: number | null; lng: number | null }>((res) => {
  if (typeof navigator === "undefined" || !navigator.geolocation) return res({ lat: null, lng: null });
  navigator.geolocation.getCurrentPosition((p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
    () => res({ lat: null, lng: null }), { enableHighAccuracy: true, timeout: 10000 });
});
const hhmm = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export function ClockWidget({ userId }: { userId: string }) {
  const { t } = useI18n();
  const toast = useToast();
  const { active, clockIn, clockOut } = useAttendance(supabaseAttendanceRepository, userId);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(i); }, []);
  const elapsed = active ? now - new Date(active.clockIn).getTime() : 0;
  const h = Math.floor(elapsed / 3600000), m = Math.floor((elapsed % 3600000) / 60000);
  const pct = Math.min(100, (elapsed / 3600000 / 8) * 100);
  async function toggle() {
    setBusy(true); const p = await getPos();
    const r = active ? await clockOut(p.lat, p.lng) : await clockIn(p.lat, p.lng);
    setBusy(false); if (!r.ok) toast.error(r.error);
  }
  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-border bg-card p-6 text-center">
      {active ? (
        <>
          <p className="text-sm text-muted-foreground">{t("working")}</p>
          <p className="mt-1 font-display text-4xl font-bold text-foreground">{h}h {m}m</p>
          <p className="text-xs text-muted-foreground">{t("clockIn")}: {hhmm(new Date(active.clockIn).getTime())}</p>
          {active.isLate && <p className="mt-2 inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 dark:bg-red-500/15 dark:text-red-300"><AlertTriangle className="h-3 w-3" /> {t("lateArrival")} +{active.lateMinutes}m</p>}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
          <button type="button" disabled={busy} onClick={() => void toggle()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-4 text-lg font-bold text-white disabled:opacity-50"><LogOut className="h-5 w-5" /> {t("markExit")}</button>
        </>
      ) : (
        <>
          <p className="font-display text-4xl font-bold text-foreground">{hhmm(now)}</p>
          <p className="text-sm capitalize text-muted-foreground">{new Date(now).toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}</p>
          <button type="button" disabled={busy} onClick={() => void toggle()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-4 text-lg font-bold text-white disabled:opacity-50"><LogIn className="h-5 w-5" /> {t("markEntry")}</button>
        </>
      )}
    </div>
  );
}
