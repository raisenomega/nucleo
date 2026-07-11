import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";

const FREQ_KEY: Record<string, TranslationKey> = { weekly: "freqWeekly", biweekly: "freqBiweekly", monthly: "freqMonthly" };

// Banner de período actual según evaluation_frequency (settings). MEJORA 3: frecuencia configurable.
export function EvalPeriodBanner({ count }: { count: number }) {
  const { t } = useI18n();
  const [freq, setFreq] = useState("monthly");
  useEffect(() => {
    void supabase.from("settings").select("value").eq("key", "evaluation_frequency").maybeSingle()
      .then(({ data }) => { if (data) setFreq(String((data as { value: unknown }).value)); });
  }, []);
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-sm">
      <span className="font-bold text-foreground">{t("currentPeriod")}:</span> {t(FREQ_KEY[freq] ?? "freqMonthly")} · {count} {t("evaluations")}
    </div>
  );
}
