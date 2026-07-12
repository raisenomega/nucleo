// Estado unificado de fetch para hooks read-only (@landing-public y futuros). Discriminated union.
export type FetchState<T> =
  | { status: "loading"; data: null }
  | { status: "ready"; data: T }
  | { status: "notfound"; data: null }
  | { status: "error"; data: null; errorMessage?: string };

export const initFetchState = <T>(): FetchState<T> => ({ status: "loading", data: null });
export const readyState = <T>(data: T): FetchState<T> => ({ status: "ready", data });
export const notFoundState = <T>(): FetchState<T> => ({ status: "notfound", data: null });
export const errorState = <T>(errorMessage?: string): FetchState<T> => ({ status: "error", data: null, errorMessage });

export const isReady = <T>(s: FetchState<T>): s is { status: "ready"; data: T } => s.status === "ready";
export const isLoading = <T>(s: FetchState<T>): boolean => s.status === "loading";
export const isNotFound = <T>(s: FetchState<T>): boolean => s.status === "notfound";
export const isError = <T>(s: FetchState<T>): boolean => s.status === "error";
