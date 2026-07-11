import { useI18n } from "@shared/i18n";
import type { PackageMode } from "@landing/domain/landing-package.types";

export function PackageModeToggleSection({ mode, requestMode, warnOpen, confirmSimple, cancelWarn }: {
  mode: PackageMode; requestMode: (m: PackageMode) => void; warnOpen: boolean; confirmSimple: () => void; cancelWarn: () => void;
}) {
  const { t } = useI18n();
  const btn = (m: PackageMode, label: string) => (
    <button type="button" onClick={() => requestMode(m)}
      className={`rounded-lg px-4 py-2 text-sm font-bold ${mode === m ? "bg-primary text-primary-foreground" : "border border-border text-foreground"}`}>{label}</button>);
  return (
    <div className="space-y-2">
      <div className="flex gap-2">{btn("simple", t("pkgSimple"))}{btn("bundle", t("pkgBundle"))}</div>
      {warnOpen && <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-foreground">
        <p>{t("pkgSwitchWarning")}</p>
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={confirmSimple} className="rounded bg-destructive px-3 py-1 font-bold text-white">{t("pkgSwitchConfirm")}</button>
          <button type="button" onClick={cancelWarn} className="rounded border border-border px-3 py-1 text-foreground">{t("cancelBtn")}</button>
        </div>
      </div>}
    </div>
  );
}
