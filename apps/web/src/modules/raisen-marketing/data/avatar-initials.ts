// Avatar de iniciales: iniciales (máx 2) + color HSL estable por hash del nombre. Usado por el card de la
// landing y la fila del editor cuando no hay avatar_url (o falla la carga de la imagen).
export const initials = (name: string): string =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0)).join("").toUpperCase() || "?";

export const avatarHsl = (name: string): string => {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h} 55% 42%)`;
};
