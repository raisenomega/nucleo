import { Type, Mail, Phone, AlignLeft, Hash, ChevronDown, CircleDot, CheckSquare, Calendar, MapPin, Grid3x3, PlusSquare, Rows, Upload } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { FieldKind } from "@order-forms/domain/field-kind.types";

export const KIND_ICON: Record<FieldKind, LucideIcon> = {
  text: Type, email: Mail, tel: Phone, textarea: AlignLeft, number: Hash, select: ChevronDown, radio: CircleDot, checkbox: CheckSquare,
  date: Calendar, address_block: MapPin, matrix: Grid3x3, addons_group: PlusSquare, repeatable_group: Rows, file_upload: Upload,
};
