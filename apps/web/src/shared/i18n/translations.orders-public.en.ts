import type { TranslationKey } from "./translations.keys";

export const enOrdersPublic = {
  opTitle: "Order", opPayment: "Payment method", opSubtotal: "Subtotal", opTax: "Tax", opShipping: "Shipping", opTotal: "Total",
  opCoupon: "Coupon", opCouponApply: "Apply", opSubmit: "Confirm order", opSubmitting: "Sending…",
  opSuccess: "Order received!", opSuccessMsg: "A representative will contact you within 24 hours to coordinate payment and delivery.", opClose: "Close",
  opErrForm: "Please review the form fields.", opErrTotal: "Total mismatch. Please reload and try again.",
  opErrRate: "Too many attempts. Please wait a moment.", opErrCoupon: "Invalid coupon.", opErrPayment: "Payment method unavailable.",
  opErrNetwork: "Could not submit the order.", opOrderBtn: "Order", opSubscribeBtn: "Subscribe",
} satisfies Partial<Record<TranslationKey, string>>;
