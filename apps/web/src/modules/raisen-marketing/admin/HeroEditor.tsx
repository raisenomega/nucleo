import { useEffect, useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useToast } from "@shared/providers/toast-context";
import { useSuperAdmin } from "@shared/hooks/useSuperAdmin";
import { getMarketingHero, saveMarketingHero } from "@raisen-marketing/infrastructure/marketing-hero.repository";
import type { MarketingHeroRow } from "@raisen-marketing/data/hero.types";
import { HeroTextFields } from "@raisen-marketing/admin/HeroTextFields";
import { HeroMediaFields } from "@raisen-marketing/admin/HeroMediaFields";

// Editor /web/hero (Super Admin): edita marketing_hero. Uploads inmediatos; Guardar persiste todos los campos.
export function HeroEditor() {
  const { isSuperAdmin } = useSuperAdmin();
  const toast = useToast();
  const [form, setForm] = useState<MarketingHeroRow | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { void getMarketingHero().then(setForm); }, []);
  if (!isSuperAdmin) return <Navigate to="/dashboard" />;
  if (!form) return <div className="p-8 text-muted-foreground">…</div>;
  const patch = (p: Partial<MarketingHeroRow>) => setForm((f) => (f ? { ...f, ...p } : f));
  const onSave = async () => {
    setSaving(true);
    const err = await saveMarketingHero(form);
    setSaving(false);
    if (err) toast.error(err); else toast.success("Hero guardado");
  };
  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="font-display text-2xl font-bold text-foreground">Editor · Hero de la landing</h1>
      <HeroTextFields form={form} patch={patch} />
      <HeroMediaFields form={form} patch={patch} />
      <button type="button" onClick={() => void onSave()} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50">
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}Guardar
      </button>
    </div>
  );
}
