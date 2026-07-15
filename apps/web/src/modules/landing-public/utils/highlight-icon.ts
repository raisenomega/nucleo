import {
  CheckCircle2, Shield, Zap, Star, Heart, Clock, Award, DollarSign, ThumbsUp, BadgeCheck,
  Sparkles, Leaf, Truck, Package, Droplets, Recycle, Wrench, Sun, Gift, Flame, Gauge,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Set curado (named imports → tree-shakeable). Alinea con LucideIconPicker; fallback CheckCircle2.
const MAP: Record<string, LucideIcon> = {
  CheckCircle2, Check: CheckCircle2, Shield, Zap, Star, Heart, Clock, Award, DollarSign, ThumbsUp,
  BadgeCheck, Sparkles, Leaf, Truck, Package, Droplets, Recycle, Wrench, Sun, Gift, Flame, Gauge,
};
export const highlightIcon = (name: string | null): LucideIcon => (name && MAP[name]) || CheckCircle2;
