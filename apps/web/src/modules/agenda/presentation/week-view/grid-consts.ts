export const SLOT_MIN = 30;
export const SLOT_PX = 32;
export const durationPx = (startIso: string, endIso: string) =>
  ((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000 / SLOT_MIN) * SLOT_PX;
