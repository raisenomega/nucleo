import type { TranslationKey } from "./translations.keys";

// Customer Portal (PWA). Merged in translations.ts.
export const enPortal = {
  navHome: "Home", navProfile: "My profile", navServices: "My services", navOrders: "My orders",
  navInvoices: "My invoices", navPayments: "Payment methods", navAppointments: "My appointments", navRequest: "Request service",
  navReviews: "My reviews", navSupport: "Support", navNotifications: "Notifications", navSettings: "Settings",
  pComingSoon: "Coming soon", pWelcome: "Hi", pMyProfile: "My profile", signOut: "Sign out",
  pCompleteProfile: "Complete your profile", pCompleteHint: "Your details are reused when you request a service.",
  pFullName: "Full name", pPhone: "Phone", pAddress: "Address", pCity: "City", pState: "State", pZip: "ZIP code",
  pContactPref: "Contact preference", pLanguage: "Language", pNotesTeam: "Notes for the team", pNotesHint: "e.g. gate code 1234, dog in the yard",
  pProfileSaved: "Profile saved", pSaveError: "Could not save", pPassword: "Password",
  pLogin: "Sign in", pMagicLink: "Send magic link", pMagicSent: "We sent a link to your email", pEmailFirst: "Enter your email first",
  pNoAccount: "No account?", pHaveAccount: "Already have an account?", pRegister: "Create account", pConfirmEmail: "Check your email to confirm your account.",
} satisfies Partial<Record<TranslationKey, string>>;
