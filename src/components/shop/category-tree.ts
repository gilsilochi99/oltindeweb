import type { ProductCategory } from '@/lib/shop/types';

export type FlatCategory = ProductCategory & { depth: number; path: string };

// Depth-first flattening of the category tree (siblings by position, then
// name), with each entry's depth and "Padre › Hijo" path — for indented
// lists and selects.
export function flattenCategories(categories: ProductCategory[]): FlatCategory[] {
  const byParent = new Map<string | null, ProductCategory[]>();
  for (const c of categories) {
    const key = c.parentId && categories.some(p => p.id === c.parentId) ? c.parentId : null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(c);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name, 'es'));
  }

  const out: FlatCategory[] = [];
  const walk = (parentId: string | null, depth: number, prefix: string) => {
    for (const c of byParent.get(parentId) ?? []) {
      const path = prefix ? `${prefix} › ${c.name}` : c.name;
      out.push({ ...c, depth, path });
      walk(c.id, depth + 1, path);
    }
  };
  walk(null, 0, '');
  return out;
}

// The category plus all of its descendants' ids.
export function descendantIds(categories: ProductCategory[], rootId: string): Set<string> {
  const ids = new Set([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of categories) {
      if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
        ids.add(c.id);
        grew = true;
      }
    }
  }
  return ids;
}
