import { MediaUploadField } from "@raisen-marketing/admin/MediaUploadField";
import type { MarketingHeroRow } from "@raisen-marketing/data/hero.types";

// Media del hero: video/imagen de fondo (upload inmediato) + slider de overlay + toggles 3D/scroll.
export function HeroMediaFields({ form, patch }: { form: MarketingHeroRow; patch: (p: Partial<MarketingHeroRow>) => void }) {
  return (
    <div className="space-y-5 rounded-xl border border-border bg-card p-4">
      <MediaUploadField label="Video de fondo (MP4/WebM · máx 50 MB)" kind="video" accept="video/mp4,video/webm" url={form.backgroundVideoUrl} onChange={(u) => patch({ backgroundVideoUrl: u })} />
      <MediaUploadField label="Imagen de fondo (JPG/PNG/WebP · máx 25 MB)" kind="image" accept="image/jpeg,image/png,image/webp" url={form.backgroundImageUrl} onChange={(u) => patch({ backgroundImageUrl: u })} />
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Opacidad del overlay: {form.mediaOverlayOpacity.toFixed(2)}</label>
        <input type="range" min={0} max={1} step={0.05} value={form.mediaOverlayOpacity} onChange={(e) => patch({ mediaOverlayOpacity: Number(e.target.value) })} className="w-full accent-primary" />
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={form.show3dScene} onChange={(e) => patch({ show3dScene: e.target.checked })} /> Mostrar escena 3D (diamante) cuando no hay media</label>
      <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={form.showScrollIndicator} onChange={(e) => patch({ showScrollIndicator: e.target.checked })} /> Mostrar indicador de scroll</label>
    </div>
  );
}
