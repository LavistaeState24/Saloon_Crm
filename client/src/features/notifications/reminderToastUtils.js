const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "";

const getDiffMinutes = (value, now = Date.now()) => {
  const dueTime = new Date(value).getTime();

  if (Number.isNaN(dueTime)) {
    return null;
  }

  return Math.floor((now - dueTime) / 60000);
};

export const getReminderToastStage = (reminder, now = Date.now()) => {
  const dueValue = reminder?.reminderDateTime || reminder?.dueDate;

  if (!dueValue) {
    return null;
  }

  const diffMinutes = getDiffMinutes(dueValue, now);

  if (diffMinutes === null || diffMinutes < 0) {
    return null;
  }

  if (diffMinutes === 0) {
    return "due";
  }

  return "overdue";
};

export const getShareRecordToastStage = (record, now = Date.now()) => {
  const dueValue = record?.followUpDate;

  if (!dueValue) {
    return null;
  }

  const diffMinutes = getDiffMinutes(dueValue, now);

  if (diffMinutes === null || diffMinutes < 0) {
    return null;
  }

  if (diffMinutes === 0) {
    return "due";
  }

  return "overdue";
};

export const buildReminderToastMessage = (reminder, stage = "due") => {
  const leadName = reminder?.client?.ownerName || "Lead";
  const type = reminder?.reminderType || "Reminder";
  const dueAt = formatDateTime(reminder?.reminderDateTime || reminder?.dueDate);
  const note = reminder?.note ? ` - ${reminder.note}` : "";
  const prefix = stage === "overdue" ? "Overdue" : "Due";

  return `${prefix} ${type.toLowerCase()} reminder for ${leadName} at ${dueAt}${note}`;
};

export const buildShareRecordToastMessage = (record, stage = "due") => {
  const leadName = record?.clientName || "Lead";
  const type = String(record?.shareChannel || "WhatsApp") === "Copy" ? "Details Send" : "WhatsApp";
  const dueAt = formatDateTime(record?.followUpDate);
  const note = " - Follow up after shared project details";
  const prefix = stage === "overdue" ? "Overdue" : "Due";

  return `${prefix} ${type.toLowerCase()} reminder for ${leadName} at ${dueAt}${note}`;
};
