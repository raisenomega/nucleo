// Traduce el error de supabase.auth.signUp a un texto fijo y seguro para la UI.
// Nunca devuelve error.message: el texto crudo de GoTrue/Postgres (p.ej. "Database error
// saving new user" del trigger handle_new_user) filtra detalles internos.
// Devuelve null cuando el error debe tratarse como éxito: "email ya registrado" se
// presenta igual que un alta nueva para no revelar qué correos tienen cuenta.
export interface SignUpErrorLike {
  code?: string;
  message?: string;
}

const EXISTS_CODES = new Set(["user_already_exists", "email_exists"]);
const RATE_CODES = new Set(["over_email_send_rate_limit", "over_request_rate_limit"]);
const EMAIL_CODES = new Set(["email_address_invalid", "validation_failed"]);

export const SIGNUP_MESSAGES = {
  weakPassword: "La contraseña es demasiado débil. Prueba con una más larga.",
  invalidEmail: "Revisa el correo y la contraseña.",
  rateLimited: "Demasiados intentos. Espera unos minutos y vuelve a probar.",
  generic: "No pudimos crear tu cuenta. Inténtalo de nuevo en unos minutos.",
} as const;

export function signUpErrorMessage(err: SignUpErrorLike): string | null {
  const code = err.code ?? "";
  if (EXISTS_CODES.has(code) || /already (been )?registered/i.test(err.message ?? "")) return null;
  if (code === "weak_password") return SIGNUP_MESSAGES.weakPassword;
  if (EMAIL_CODES.has(code)) return SIGNUP_MESSAGES.invalidEmail;
  if (RATE_CODES.has(code)) return SIGNUP_MESSAGES.rateLimited;
  return SIGNUP_MESSAGES.generic;
}
