import type { ChartAccount } from "@accounting/domain/chart-of-accounts.types";

// Convierte la lista plana (con parentId) en árbol jerárquico ordenado por accountCode en cada nivel.
export function buildAccountTree(flat: readonly ChartAccount[]): ChartAccount[] {
  const byId = new Map<string, ChartAccount & { children: ChartAccount[] }>();
  flat.forEach((a) => byId.set(a.id, { ...a, children: [] }));
  const roots: (ChartAccount & { children: ChartAccount[] })[] = [];
  byId.forEach((node) => {
    const parent = node.parentId ? byId.get(node.parentId) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });
  const sort = (list: (ChartAccount & { children: ChartAccount[] })[]) => {
    list.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
    list.forEach((n) => sort(n.children as (ChartAccount & { children: ChartAccount[] })[]));
  };
  sort(roots);
  return roots;
}
