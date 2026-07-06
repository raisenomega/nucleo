// Links externos para una parada: WhatsApp y Google Maps (direcciones).
export const waLink = (phone: string, msg: string) =>
  `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
export const mapLink = (address: string, city: string | null) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${address}${city ? ", " + city : ""}`)}`;
