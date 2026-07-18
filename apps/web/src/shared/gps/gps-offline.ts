import type { GpsPointInput } from "@shared/gps/gps.repository";

// Buffer offline en IndexedDB (async, soporta miles de puntos; NO localStorage). No pierde puntos sin internet.
const DB = "nucleo_gps", STORE = "gps_offline_buffer", MAX = 10000;

function withStore<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(STORE);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const req = fn(open.result.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => reject(req.error);
    };
  });
}

export async function readBuffer(): Promise<GpsPointInput[]> {
  try { return (await withStore<GpsPointInput[] | undefined>("readonly", (s) => s.get("all"))) ?? []; } catch { return []; }
}
export async function bufferPoints(pts: GpsPointInput[]): Promise<void> {
  try { const next = [...(await readBuffer()), ...pts].slice(-MAX); await withStore("readwrite", (s) => s.put(next, "all")); } catch { /* noop */ }
}
export async function clearBuffer(): Promise<void> {
  try { await withStore("readwrite", (s) => s.delete("all")); } catch { /* noop */ }
}
export async function putAuth(auth: { url: string; key: string; token: string }): Promise<void> {
  try { await withStore("readwrite", (s) => s.put(auth, "auth")); } catch { /* noop */ }
}

// Registra Background Sync (Chrome/Android). En Safari/iOS no existe la API → no-op silencioso.
export async function registerGpsSync(): Promise<void> {
  try {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const reg = (await navigator.serviceWorker.ready) as ServiceWorkerRegistration & { sync?: { register: (t: string) => Promise<void> } };
    if (reg.sync) await reg.sync.register("gps-sync");
  } catch { /* Background Sync no soportado */ }
}
