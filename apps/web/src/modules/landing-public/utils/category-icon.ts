import {
  Package, Wrench, Home, ShoppingCart, Truck, Sparkles, Droplets, Trash2, Recycle, Hammer,
  Paintbrush, Leaf, Sun, Zap, Shield, Star, Heart, Gift, Tag, Box, Building2, Store, Factory,
  Warehouse, Container, Boxes, Wind, Flame, Waves, TreePine, Bug, SprayCan, Bath, Brush, Snowflake,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Set curado (named imports → tree-shakeable, no barrel completo de lucide en el bundle de la landing).
const MAP: Record<string, LucideIcon> = { Package, Wrench, Home, ShoppingCart, Truck, Sparkles, Droplets, Trash2, Recycle, Hammer, Paintbrush, Leaf, Sun, Zap, Shield, Star, Heart, Gift, Tag, Box, Building2, Store, Factory, Warehouse, Container, Boxes, Wind, Flame, Waves, TreePine, Bug, SprayCan, Bath, Brush, Snowflake };
export const categoryIcon = (name: string | null): LucideIcon => (name && MAP[name]) || Tag;
