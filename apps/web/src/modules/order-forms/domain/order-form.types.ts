import type { EditorField } from "@order-forms/domain/order-form-field.types";

export type Result = { ok: true } | { ok: false; error: string };

export interface OrderFormSummary {
  id: string; name: string; description: string; isDefault: boolean;
  appliesToKind: string | null; fieldCount: number; createdAt: string;
}
export interface OrderFormFull {
  id: string; name: string; description: string; isDefault: boolean;
  appliesToKind: string | null; fields: EditorField[];
}

export interface IOrderFormsRepository {
  list(): Promise<OrderFormSummary[]>;
  get(id: string): Promise<OrderFormFull | null>;
  create(tenantId: string, name: string, description: string): Promise<string | null>;
  saveForm(id: string, name: string, description: string): Promise<Result>;
  saveFields(tenantId: string, formId: string, fields: EditorField[], deletedIds: string[]): Promise<Result>;
  duplicate(tenantId: string, id: string): Promise<string | null>;
  remove(id: string): Promise<Result>;
  setDefault(id: string): Promise<Result>;
}
