import { useState } from "react";
import type { EditorField } from "@order-forms/domain/order-form-field.types";
import type { IOrderFormsRepository } from "@order-forms/domain/order-form.types";

// Mutaciones de formularios: create/saveForm/saveFields/duplicate/remove/setDefault.
export function useOrderFormActions(repo: IOrderFormsRepository) {
  const [busy, setBusy] = useState(false);
  async function wrap<T>(fn: () => Promise<T>): Promise<T> { setBusy(true); try { return await fn(); } finally { setBusy(false); } }
  return {
    busy,
    create: (tid: string, name: string, desc: string) => wrap(() => repo.create(tid, name, desc)),
    saveForm: (id: string, name: string, desc: string) => wrap(() => repo.saveForm(id, name, desc)),
    saveFields: (tid: string, fid: string, fields: EditorField[], del: string[]) => wrap(() => repo.saveFields(tid, fid, fields, del)),
    duplicate: (tid: string, id: string) => wrap(() => repo.duplicate(tid, id)),
    remove: (id: string) => wrap(() => repo.remove(id)),
    setDefault: (id: string) => wrap(() => repo.setDefault(id)),
  };
}
