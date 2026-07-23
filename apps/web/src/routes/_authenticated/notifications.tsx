import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useI18n, type TranslationKey } from "@shared/i18n";
import { Pagination } from "@shared/components/Pagination";
import { useNotifications } from "@shared/notifications/useNotifications.hook";
import { NotificationItem } from "@shared/notifications/NotificationItem";
import { notifRoute, notifCategory } from "@shared/notifications/notif-format";
import type { NotifFilter, AppNotification } from "@shared/notifications/notification.types";

export const Route = createFileRoute("/_authenticated/notifications")({ component: NotificationsPage });
const FILTERS: NotifFilter[] = ["all", "unread", "order", "lead", "appointment", "management", "system"];
const LABEL: Record<NotifFilter, TranslationKey> = { all: "filterAll", unread: "notifUnread", order: "orders", lead: "leads", appointment: "agenda", management: "management", system: "system" };

function NotificationsPage() {
  const { t } = useI18n();
  const n = useNotifications(200, false);
  const [filter, setFilter] = useState<NotifFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const open = (it: AppNotification) => { void n.markRead(it.id); window.location.assign(notifRoute(it.entityType, it.entityId)); };
  const shown = useMemo(() => n.items.filter((it) => {
    const okF = filter === "all" || (filter === "unread" ? !it.readAt : notifCategory(it.entityType) === filter);
    const q = search.trim().toLowerCase();
    return okF && (!q || `${it.title} ${it.body}`.toLowerCase().includes(q));
  }), [n.items, filter, search]);
  const visible = shown.slice((page - 1) * 20, page * 20);
  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("notifications")}</h1>
        {n.unread > 0 && <button type="button" onClick={() => void n.markAll()} className="rounded-lg bg-secondary px-3 py-2 text-sm font-bold">{t("markAllRead")}</button>}
      </div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search")} className="w-full rounded-lg border border-border bg-background p-2 text-sm" />
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => <button key={f} type="button" onClick={() => { setFilter(f); setPage(1); }} className={`rounded-lg px-3 py-1.5 text-sm font-bold ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>{t(LABEL[f])}</button>)}
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {visible.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">{t("noNotifications")}</p>}
        {visible.map((it) => <NotificationItem key={it.id} n={it} onOpen={open} onDismiss={n.dismiss} />)}
      </div>
      <Pagination total={shown.length} page={page} onPageChange={setPage} />
    </div>
  );
}
