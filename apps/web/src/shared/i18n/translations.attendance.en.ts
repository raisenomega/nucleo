import type { TranslationKey } from "./translations.keys";

// Attendance + leave dictionary (RRHH-5). Merged into translations.ts.
export const enAttendance = {
  attendance: "Attendance", attendanceConfig: "Settings", today: "Today", working: "Working",
  clockIn: "Clock in", clockOut: "Clock out", hoursWorked: "Hours", markEntry: "Clock In", markExit: "Clock Out",
  lateArrival: "Late", records: "records", completed: "Completed", thisWeek: "This week", thisMonth: "This month",
  allEmployees: "All", totalHours: "Total hours", regularHours: "Regular", overtimeHours: "Overtime", daysWorked: "Days",
  adjust: "Adjust", adjustAttendance: "Adjust record", adjustmentReason: "Adjustment reason",
  workStart: "Work start", workEnd: "Work end", dailyLimit: "Daily hours", weeklyLimit: "Weekly hours",
  overtimeMultiplier: "Overtime multiplier", graceMinutes: "Grace minutes", autoCheckout: "Auto-checkout", requireGps: "Require GPS",
  leave: "Leave", requestLeave: "Request leave", leaveType: "Type", halfDay: "Half day", morning: "Morning", afternoon: "Afternoon",
  daysRequested: "Days", insufficientBalance: "Insufficient balance", sendRequest: "Send request",
  lsPending: "Pending", lsApproved: "Approved", lsRejected: "Rejected", lsCancelled: "Cancelled",
  myRequests: "My requests", pendingApproval: "Pending", leaveBalance: "Balances", teamCalendar: "Calendar",
  rejectionReason: "Rejection reason", noAbsences: "No one out this month",
} satisfies Partial<Record<TranslationKey, string>>;
