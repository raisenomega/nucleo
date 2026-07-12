export function BlockedPeriodBand({ top, height, label }: { top: number; height: number; label: string }) {
  if (height <= 0) return null;
  return (
    <div style={{ top, height }} className="pointer-events-none absolute inset-x-0 z-0 overflow-hidden bg-muted/60 px-1 text-[9px] text-muted-foreground">{label}</div>
  );
}
