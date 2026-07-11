// Badge_label sobre la imagen del paquete (absolute top-right).
export function PackageBadge({ label }: { label: string }) {
  return (
    <span role="status" className="absolute right-3 top-3 z-10 rounded-full px-3 py-1 text-sm font-bold text-white"
      style={{ background: "hsl(var(--tenant-accent-hsl))" }}>{label}</span>
  );
}
