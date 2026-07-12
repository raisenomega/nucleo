// Cache en memoria con expiración por TTL. Puro (sin React, sin side-effects globales), testeable en aislamiento.
// get() devuelve null tanto en miss como en expirado → el consumidor lo trata como cache miss (refetch).
type CacheEntry<T> = { value: T; expiresAt: number };

export interface TtlCache<T> {
  get(key: string): T | null;
  set(key: string, value: T): void;
  clear(): void;
}

export function createTtlCache<T>(ttlMs: number): TtlCache<T> {
  const map = new Map<string, CacheEntry<T>>();
  return {
    get(key) {
      const e = map.get(key);
      if (!e) return null;
      if (Date.now() >= e.expiresAt) { map.delete(key); return null; }
      return e.value;
    },
    set(key, value) { map.set(key, { value, expiresAt: Date.now() + ttlMs }); },
    clear() { map.clear(); },
  };
}
