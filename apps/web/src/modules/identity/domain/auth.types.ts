// BC identity — tipos de dominio de autenticación. Puro: sin imports externos.
// Result Pattern (A5): operaciones fallibles retornan Result, cero throw.

export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export interface Session {
  readonly userId: string;
  readonly tenantId: string | null;
  readonly role: string | null;
  readonly email: string;
}

export interface AuthError {
  readonly code: "invalid_credentials" | "no_session" | "unknown";
  readonly message: string;
}

export type AuthResult = Result<Session, AuthError>;

// Puerto de autenticación — lo implementa infrastructure; lo consume application.
export interface IAuthPort {
  signIn(email: string, password: string): Promise<AuthResult>;
  signOut(): Promise<void>;
  getSession(): Promise<Session | null>;
  onAuthStateChange(cb: (session: Session | null) => void): () => void;
}
