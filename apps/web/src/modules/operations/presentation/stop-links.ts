// Links externos para una parada: WhatsApp y Google Maps (direcciones).
// wa.me exige el número con código de país. Si es local NANP (10 dígitos, RD/PR/US) anteponemos "1".
export const waLink = (phone: string, msg: string) => {
  const d = phone.replace(/\D/g, "");
  const full = d.length === 10 ? `1${d}` : d;
  return `https://wa.me/${full}?text=${encodeURIComponent(msg)}`;
};
export const mapLink = (address: string, city: string | null) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${address}${city ? ", " + city : ""}`)}`;
