import { useCallback, useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";

// Estado y acciones de MFA TOTP (Supabase Auth). El backend de MFA ya lo provee Supabase;
// aquí sólo orquestamos enroll → challenge → verify, y registramos guardian events.
export function useMfa() {
  const [active, setActive] = useState(false);
  const [qr, setQr] = useState("");
  const [factorId, setFactorId] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    setActive(!!data?.totp?.some((f) => f.status === "verified"));
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const start = useCallback(async () => {
    setBusy(true); setMsg("");
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setBusy(false);
    if (error || !data) { setMsg(error?.message ?? "error"); return; }
    setFactorId(data.id); setQr(data.totp.qr_code);
  }, []);

  const confirm = useCallback(async (code: string, badMsg: string) => {
    setBusy(true); setMsg("");
    const ch = await supabase.auth.mfa.challenge({ factorId });
    if (ch.error || !ch.data) { setBusy(false); setMsg(ch.error?.message ?? "error"); return false; }
    const v = await supabase.auth.mfa.verify({ factorId, challengeId: ch.data.id, code });
    setBusy(false);
    if (v.error) { setMsg(badMsg); return false; }
    setQr(""); void supabase.rpc("log_mfa_event", { p_type: "mfa_enrolled" });
    await refresh();
    return true;
  }, [factorId, refresh]);

  const disable = useCallback(async () => {
    setBusy(true);
    const { data } = await supabase.auth.mfa.listFactors();
    for (const f of data?.totp ?? []) await supabase.auth.mfa.unenroll({ factorId: f.id });
    void supabase.rpc("log_mfa_event", { p_type: "mfa_disabled" });
    await refresh(); setBusy(false);
  }, [refresh]);

  return { active, qr, msg, busy, start, confirm, disable };
}
