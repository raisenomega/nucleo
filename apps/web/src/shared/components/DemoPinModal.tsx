import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { supabase } from "@shared/lib/supabase";
import { ScreenModal } from "@shared/components/ScreenModal";
import { useToast } from "@shared/providers/toast-context";
import { useDemoOwner } from "@shared/providers/demo-owner-context";

export function DemoPinModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const { enableOwnerMode } = useDemoOwner();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [bad, setBad] = useState(false);
  const verify = async () => {
    setBusy(true); setBad(false);
    const { data } = await supabase.rpc("verify_demo_owner_pin", { p_pin: pin });
    setBusy(false);
    if (data === true) { enableOwnerMode(); toast.success(t("demoOwnerOn")); onClose(); }
    else { setBad(true); setPin(""); }
  };
  return (
    <ScreenModal onClose={onClose}>
      <div className="mx-auto w-full max-w-xs space-y-4 p-6 text-center">
        <h2 className="font-display text-lg font-bold text-foreground">🔑 {t("demoOwnerTitle")}</h2>
        <input value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setBad(false); }}
          type="password" inputMode="numeric" maxLength={4} autoFocus placeholder="••••"
          className={`w-full rounded-lg border bg-background p-3 text-center text-3xl tracking-[0.5em] text-foreground ${bad ? "border-destructive" : "border-border"}`} />
        {bad && <p className="text-sm text-destructive">{t("demoPinBad")}</p>}
        <button type="button" disabled={busy || pin.length !== 4} onClick={() => void verify()}
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">{t("demoVerify")}</button>
        <p className="text-xs text-muted-foreground">{t("demoOwnerNote")}</p>
      </div>
    </ScreenModal>
  );
}
