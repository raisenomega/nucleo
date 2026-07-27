// Helpers de formato de asistencia.
export const clockHHMM = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

export const hoursLabel = (h: number | null): string => (h != null ? `${h}h` : "—");

// datetime-local value (YYYY-MM-DDTHH:mm) desde un ISO.
export const toLocalInput = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
};
