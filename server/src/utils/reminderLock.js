import { ApiError } from "./ApiError.js";

export const shouldBlockReminderAction = (role, hasOverdueReminder) => hasOverdueReminder && role !== "super-admin";

export const shouldBlockReminderCreation = (role, hasOverdueReminder) => hasOverdueReminder && role !== "super-admin";

export const buildReminderLockOverrideActivity = ({
  performedBy,
  targetId,
  leadId = targetId,
  module = "reminders",
  message = "Super Admin bypassed overdue reminder lock",
  metadata = {},
}) => ({
  action: "REMINDER_LOCK_OVERRIDDEN",
  module,
  performedBy,
  targetId,
  leadId,
  message,
  metadata: {
    ...metadata,
    bypassed: true,
  },
});

export const createReminderLockError = () => new ApiError(403, "Complete overdue reminder before continuing");
