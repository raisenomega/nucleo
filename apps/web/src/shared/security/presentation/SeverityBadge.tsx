// Badge de color por severidad (guardian) o riesgo (audit). Patrón MAP → clase Tailwind.
const MAP: Record<string, string> = {
  critical: "text-red-600",
  high: "text-orange-600",
  warning: "text-yellow-600",
  medium: "text-yellow-600",
  info: "text-blue-600",
  low: "text-muted-foreground",
};

export function SeverityBadge({ level }: { level: string }) {
  const cls = MAP[level] ?? "text-muted-foreground";
  return <span className={`rounded border border-current px-1.5 py-0.5 text-xs font-bold ${cls}`}>{level}</span>;
}
