import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { listDevices, type DeviceProfile } from "@assets/infrastructure/device.repository";
import { DeviceConfigDialog } from "@assets/presentation/DeviceConfigDialog";

// Tab Dispositivos: estado (última conexión, batería) + editor de config. Salud: batería<20 rojo, >1h ámbar.
const ago = (iso: string | null): string => {
  if (!iso) return "—";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  return s < 3600 ? `${Math.round(s / 60)}m` : s < 86400 ? `${Math.round(s / 3600)}h` : `${Math.round(s / 86400)}d`;
};
const stale = (iso: string | null) => !iso || (Date.now() - new Date(iso).getTime()) / 3600000 > 1;

export function DevicesTab() {
  const { t } = useI18n();
  const [rows, setRows] = useState<DeviceProfile[]>([]);
  const [editing, setEditing] = useState<DeviceProfile | null>(null);
  const load = () => void listDevices().then(setRows);
  useEffect(load, []);
  const th = "px-3 py-2 text-left font-bold";
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr><th className={th}>{t("assignedTo")}</th><th className={th}>{t("deviceName")}</th><th className={th}>{t("platform")}</th><th className={th}>{t("lastSeen")}</th><th className={th}>{t("battery")}</th><th className={th}>{t("gpsInterval")}</th><th className={th} /></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">—</td></tr>}
            {rows.map((d) => (
              <tr key={d.id} className="border-t border-border">
                <td className="px-3 py-2 font-medium text-foreground">{d.employeeName}</td>
                <td className="px-3 py-2 text-muted-foreground">{d.deviceName}</td>
                <td className="px-3 py-2 text-muted-foreground">{d.platform}</td>
                <td className="px-3 py-2"><span className={stale(d.lastSeenAt) ? "font-bold text-amber-600" : "text-muted-foreground"}>{ago(d.lastSeenAt)}</span></td>
                <td className="px-3 py-2"><span className={d.battery != null && d.battery < 20 ? "font-bold text-destructive" : "text-muted-foreground"}>{d.battery != null ? `${d.battery}%` : "—"}</span></td>
                <td className="px-3 py-2 text-muted-foreground">{d.gpsInterval}s</td>
                <td className="px-3 py-2 text-right"><button type="button" onClick={() => setEditing(d)} className="rounded p-1.5 text-muted-foreground hover:bg-secondary"><Settings className="h-4 w-4" /></button></td>
              </tr>))}
          </tbody>
        </table>
      </div>
      {editing && <DeviceConfigDialog device={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}
