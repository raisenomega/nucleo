import { Flame, Snowflake, Thermometer } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@shared/i18n";

// Valores canónicos almacenados en DB (text). El label se traduce con t(key).
export const TEMPS: { value: string; key: TranslationKey; icon: LucideIcon; color: string }[] = [
  { value: "hot", key: "hot", icon: Flame, color: "bg-red-500/15 text-red-600" },
  { value: "warm", key: "warm", icon: Thermometer, color: "bg-orange-500/15 text-orange-600" },
  { value: "cold", key: "cold", icon: Snowflake, color: "bg-blue-500/15 text-blue-600" },
];

export const STATUSES: { value: string; key: TranslationKey; color: string }[] = [
  { value: "new", key: "statusNew", color: "bg-secondary text-foreground" },
  { value: "contacted", key: "statusContacted", color: "bg-blue-500/15 text-blue-600" },
  { value: "quoted", key: "statusQuoted", color: "bg-yellow-500/15 text-yellow-700" },
  { value: "converted", key: "statusConverted", color: "bg-green-500/15 text-green-600" },
  { value: "lost", key: "statusLost", color: "bg-red-500/15 text-red-600" },
];
