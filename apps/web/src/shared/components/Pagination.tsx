import { useI18n } from "@shared/i18n";

// Paginación reutilizable (12 por página). Se oculta si hay una sola página.
export function Pagination({ total, page, pageSize = 12, onPageChange }: {
  total: number; page: number; pageSize?: number; onPageChange: (p: number) => void;
}) {
  const { t } = useI18n();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  const b = "rounded-lg px-3 py-1.5 text-sm font-bold disabled:opacity-40";
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
      <span className="text-xs text-muted-foreground">{t("showing")} {from}-{to} {t("ofTotal")} {total}</span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className={`${b} bg-secondary`}>{t("prev")}</button>
        {nums.map((n) => (
          <button key={n} type="button" onClick={() => onPageChange(n)}
            className={`${b} ${n === page ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{n}</button>
        ))}
        <button type="button" disabled={page >= pages} onClick={() => onPageChange(page + 1)} className={`${b} bg-secondary`}>{t("next")}</button>
      </div>
    </div>
  );
}
