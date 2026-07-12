import type { TranslationKey } from "./translations.keys";

export const enOrders = {
  ordSearchPlaceholder: "Search by number, customer, email or phone…",
  ordFilterAll: "All", ordDateToday: "Today", ordDate7: "7 days", ordDate30: "30 days", ordDateMonth: "This month", ordDateAll: "All",
  ordStatusPending: "Pending", ordStatusAwaiting: "Awaiting payment", ordStatusPaid: "Paid", ordStatusProcessing: "Processing",
  ordStatusShipped: "Shipped", ordStatusDelivered: "Delivered", ordStatusCanceled: "Canceled", ordStatusRefunded: "Refunded",
  ordColOrder: "Order #", ordColCustomer: "Customer", ordColItems: "Items", ordColDate: "Date", ordItemsCount: "{n} items",
  ordEmptyTitle: "No web orders yet", ordEmptyDesc: "Orders placed from your landing page will show up here.",
  ordLoadMore: "Load more", ordErrGeneric: "Could not complete the action",
  ordCustomerTitle: "Customer", ordSource: "Source", ordItemsTitle: "Items",
  ordTotSubtotal: "Subtotal", ordTotTax: "Tax", ordTotShipping: "Shipping", ordTotDiscount: "Discount", ordTotTotal: "Total",
  ordTimelineTitle: "History", ordTimelineCreated: "Order created", ordTimelineChanged: "Status changed to {status}",
  ordChangeTitle: "Change status", ordChangeNewStatus: "New status", ordChangeNote: "Note (optional)", ordChangeBtn: "Save", ordChangeSuccess: "Status updated",
  ordConfirmTitle: "Mark as paid", ordConfirmMethod: "Payment method", ordConfirmMethodAuto: "Cash (default)", ordConfirmCreateInvoice: "Generate invoice automatically",
  ordConfirmBtn: "Confirm payment", ordConfirmSuccess: "Paid · income recorded",
  ordActionConfirm: "Mark as paid", ordActionChangeStatus: "Change status", ordActionView: "View",
  ordLinkedInvoice: "Invoice", ordLinkedLead: "Lead", ordBack: "Back to orders",
  ordErrAlreadyConfirmed: "Order is already paid", ordErrForbidden: "Not authorized",
} satisfies Partial<Record<TranslationKey, string>>;
