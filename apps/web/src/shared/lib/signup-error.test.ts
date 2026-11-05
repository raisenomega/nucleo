import { describe, expect, it } from "vitest";
import { SIGNUP_MESSAGES, signUpErrorMessage } from "./signup-error";

describe("signUpErrorMessage", () => {
  it("nunca devuelve el texto crudo del servidor", () => {
    const raw = "Database error saving new user: relation tenants violates constraint";
    const out = signUpErrorMessage({ code: "unexpected_failure", message: raw });
    expect(out).toBe(SIGNUP_MESSAGES.generic);
    expect(out).not.toContain("Database");
  });

  it.each([
    [{ code: "user_already_exists", message: "User already registered" }],
    [{ code: "email_exists", message: "x" }],
    [{ message: "A user with this email address has already been registered" }],
  ])("email existente se trata como éxito (null): %o", (err) => {
    expect(signUpErrorMessage(err)).toBeNull();
  });

  it.each([
    ["weak_password", SIGNUP_MESSAGES.weakPassword],
    ["email_address_invalid", SIGNUP_MESSAGES.invalidEmail],
    ["over_email_send_rate_limit", SIGNUP_MESSAGES.rateLimited],
    [undefined, SIGNUP_MESSAGES.generic],
  ])("código %s → mensaje fijo", (code, expected) => {
    expect(signUpErrorMessage({ code, message: "crudo" })).toBe(expected);
  });
});
