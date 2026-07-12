import { useState } from "react";
import { OPTION_KINDS, type FieldKind } from "@order-forms/domain/field-kind.types";
import type { EditorField, FieldPatch } from "@order-forms/domain/order-form-field.types";
import type { OrderFormFull } from "@order-forms/domain/order-form.types";

const makeField = (kind: FieldKind, order: number): EditorField => ({
  id: crypto.randomUUID(), kind, fieldKey: `${kind}_${Math.random().toString(36).slice(2, 7)}`, orderIndex: order,
  labelEs: "", labelEn: "", placeholderEs: "", placeholderEn: "", required: false, groupName: "", validation: {},
  options: OPTION_KINDS.includes(kind) ? [{ value: "opt1", label_es: "Opción 1", label_en: "Option 1" }] : [], conditionalOn: null,
});
const reindex = (fs: EditorField[]) => fs.map((f, i) => ({ ...f, orderIndex: i }));

export function useFormEditorState(initial: OrderFormFull) {
  const [name, setNameS] = useState(initial.name);
  const [description, setDescS] = useState(initial.description);
  const [fields, setFields] = useState<EditorField[]>(initial.fields);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const touch = () => setDirty(true);
  return {
    name, description, fields, selectedId, deletedIds, dirty,
    selected: fields.find((f) => f.id === selectedId) ?? null,
    setName: (v: string) => { setNameS(v); touch(); },
    setDescription: (v: string) => { setDescS(v); touch(); },
    setSelectedId,
    addField: (kind: FieldKind) => { const f = makeField(kind, fields.length); setFields((p) => [...p, f]); setSelectedId(f.id); touch(); },
    updateField: (id: string, patch: FieldPatch) => { setFields((p) => p.map((f) => (f.id === id ? { ...f, ...patch } : f))); touch(); },
    removeField: (id: string) => { setFields((p) => reindex(p.filter((f) => f.id !== id))); setDeletedIds((p) => [...p, id]); setSelectedId((s) => (s === id ? null : s)); touch(); },
    moveField: (id: string, dir: -1 | 1) => setFields((p) => { const i = p.findIndex((f) => f.id === id); const j = i + dir; if (i < 0 || j < 0 || j >= p.length) return p; const c = [...p]; const tmp = c[i]!; c[i] = c[j]!; c[j] = tmp; touch(); return reindex(c); }),
    markSaved: () => { setDirty(false); setDeletedIds([]); },
  };
}
