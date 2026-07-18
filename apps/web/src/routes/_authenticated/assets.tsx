import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Plus, FileText } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { usePdf } from "@shared/hooks/usePdf";
import { assetsReportBody } from "@assets/presentation/assets-report";
import { useAssets } from "@assets/application/useAssets.hook";
import { supabaseAssetRepository } from "@assets/infrastructure/supabase-asset.repository";
import { AssetKpis } from "@assets/presentation/AssetKpis";
import { AssetFilters, type AssetFilter } from "@assets/presentation/AssetFilters";
import { AssetForm } from "@assets/presentation/AssetForm";
import { AssetsPanel } from "@assets/presentation/AssetsPanel";
import type { AssetFormData, ProfileRef } from "@assets/domain/asset.types";

export const Route = createFileRoute("/_authenticated/assets")({ component: AssetsPage });

function AssetsPage() {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const pdf = usePdf();
  const assets = useAssets(supabaseAssetRepository);
  const [editing, setEditing] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<ProfileRef[]>([]);
  const [filter, setFilter] = useState<AssetFilter>("all");
  const [search, setSearch] = useState("");
  const now = useMemo(() => new Date(), []);
  const items = assets.items;
  useEffect(() => { void supabase.from("profiles").select("id, full_name").then(({ data }) => setProfiles(((data as { id: string; full_name: string }[] | null) ?? []).map((p) => ({ id: p.id, name: p.full_name })))); }, []);
  const shown = useMemo(() => items.filter((a) => {
    const q = search.trim().toLowerCase();
    const okF = filter === "all" || (filter === "maintenance" && a.status === "maintenance") || (filter === "retired" && a.status === "retired") || (filter === a.assetType);
    return okF && (!q || `${a.name} ${a.category} ${a.brand} ${a.model} ${a.serialNumber} ${a.assignedToName}`.toLowerCase().includes(q));
  }), [items, filter, search]);
  const editRow = useMemo<AssetFormData | undefined>(() => items.find((x) => x.id === editing), [editing, items]);
  async function submit(d: AssetFormData) { if (editing && editing !== "new") await assets.update(editing, d); else await assets.create(d); setEditing(null); }
  const onDelete = (id: string) => { if (window.confirm(`${t("delete")}?`)) void assets.remove(id); };

  if (!can("assets", "view")) return <Navigate to="/dashboard" />;
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("assets")}</h1>
        <div className="flex items-center gap-2">
          <button type="button" disabled={pdf.generating || !items.length} onClick={() => void pdf.generatePdf("report", null, assetsReportBody(items, now, t))} className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs font-bold disabled:opacity-50"><FileText className="h-4 w-4" /> {pdf.generating ? t("generatingPdf") : t("assetReport")}</button>
          {can("assets", "create") && <button type="button" onClick={() => setEditing("new")} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-body font-bold"><Plus className="h-4 w-4" /> {t("newAsset")}</button>}
        </div>
      </div>
      <AssetKpis items={items} now={now} />
      <AssetFilters filter={filter} search={search} onFilter={setFilter} onSearch={setSearch} />
      {editing !== null && <AssetForm key={editing} initial={editRow} profiles={profiles} onSubmit={submit} onCancel={() => setEditing(null)} />}
      <AssetsPanel assets={assets} rows={shown} now={now} profiles={profiles} onEdit={setEditing} onDelete={onDelete} />
    </div>
  );
}
