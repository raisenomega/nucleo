import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { updateDeviceConfig, type DeviceProfile } from "@assets/infrastructure/device.repository";

// Editor de config del dispositivo (solo CEO/COO por RLS). Al guardar, la próxima llamada a report_device_status
// del chofer recibe la nueva config y la app la aplica (intervalo GPS/buffer/wake lock/cámara).
export function DeviceConfigDialog({ device, onClose, onSaved }: { device: DeviceProfile; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n();
  const [gpsIv, setGpsIv] = useState(device.gpsInterval);
  const [buffer, setBuffer] = useState(device.offlineBuffer);
  const [wake, setWake] = useState(device.wakeLock);
  const [cam, setCam] = useState(device.cameraOn);
  const save = async () => {
    await updateDeviceConfig(device.id, { gps_interval_seconds: gpsIv, offline_buffer_size: buffer, wake_lock_enabled: wake, camera_enabled: cam });
    onSaved();
  };
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-4 p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{device.deviceName}</h2>
        <label className="block text-sm text-foreground">{t("gpsInterval")}: <b>{gpsIv}s</b>
          <input type="range" min={10} max={120} step={5} value={gpsIv} onChange={(e) => setGpsIv(Number(e.target.value))} className="w-full" /></label>
        <label className="block text-sm text-foreground">{t("offlineBuffer")}: <b>{buffer}</b>
          <input type="range" min={1000} max={50000} step={1000} value={buffer} onChange={(e) => setBuffer(Number(e.target.value))} className="w-full" /></label>
        <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={wake} onChange={(e) => setWake(e.target.checked)} />{t("wakeLock")}</label>
        <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={cam} onChange={(e) => setCam(e.target.checked)} />{t("cameraOn")}</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => void save()} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">{t("save")}</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-foreground">{t("cancel")}</button>
        </div>
      </div>
    </ScreenModal>
  );
}
