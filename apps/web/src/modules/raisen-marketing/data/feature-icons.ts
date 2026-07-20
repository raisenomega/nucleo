import { FileText, Route, BarChart3, Bot, Zap, Shield, Globe, Users, Code, Palette, TrendingUp, Heart, Star, Sparkles, Rocket, MessageSquare, Bell, Calendar, CreditCard, Package, Truck, Wrench, LayoutDashboard, UserPlus, Calculator, LayoutGrid, Building2, Handshake, type LucideIcon } from "lucide-react";

// Set de íconos lucide para features/proceso/soluciones (landing + icon picker del editor). name → componente.
export const FEATURE_ICONS: Record<string, LucideIcon> = {
  FileText, Route, BarChart3, Bot, Zap, Shield, Globe, Users, Code, Palette, TrendingUp, Heart,
  Star, Sparkles, Rocket, MessageSquare, Bell, Calendar, CreditCard, Package, Truck, Wrench, LayoutDashboard, UserPlus,
  Calculator, LayoutGrid, Building2, Handshake,
};
export const FEATURE_ICON_NAMES = Object.keys(FEATURE_ICONS);
export const featureIcon = (name: string): LucideIcon => FEATURE_ICONS[name] ?? Zap;
