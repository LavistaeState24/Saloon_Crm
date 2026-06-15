import {
  throwIfValidationFailed,
  validateDate,
  validateEnum,
  validateObjectId,
  validateOptionalText,
  validateRequiredText,
} from "./common.js";

const reminderTypes = ["Call", "WhatsApp", "Details Send", "Site Visit", "Payment", "Document"];
const reminderStatuses = ["Pending", "Completed", "Overdue", "Cancelled"];

const reminderTypeToLegacyType = {
  Call: "call",
  WhatsApp: "whatsapp",
  "Details Send": "details send",
  "Site Visit": "site visit",
  Payment: "payment",
  Document: "document",
};

export const validateFollowupInput = (payload) => {
  const errors = {};
  const reminderType = validateEnum(errors, "reminderType", payload.reminderType || payload.type, {
    label: "Reminder type",
    values: reminderTypes,
  });
  const reminderDateTime = validateDate(errors, "reminderDateTime", payload.reminderDateTime || payload.dueDate, {
    label: "Reminder date/time",
    required: true,
  });

  const sanitized = {
    client: validateObjectId(errors, "client", payload.client, { label: "Client" }),
    project: validateObjectId(errors, "project", payload.project, { label: "Project", required: false }) || undefined,
    assignedStaff: validateObjectId(errors, "assignedStaff", payload.assignedStaff, { label: "Assigned staff" }),
    note: validateRequiredText(errors, "note", payload.note, { label: "Note", min: 3, max: 500 }),
    reminderDateTime,
    dueDate: reminderDateTime,
    reminderType,
    type: reminderTypeToLegacyType[reminderType],
    status: validateEnum(errors, "status", payload.status || "Pending", {
      label: "Status",
      values: reminderStatuses,
      required: false,
    }) || "Pending",
    completed: Boolean(payload.completed),
  };

  throwIfValidationFailed(errors);
  return sanitized;
};

export const validateFollowupUpdateInput = (payload) => {
  const errors = {};
  const sanitized = {};

  if (Object.prototype.hasOwnProperty.call(payload, "assignedStaff")) {
    sanitized.assignedStaff = validateObjectId(errors, "assignedStaff", payload.assignedStaff, { label: "Assigned staff" });
  }

  if (Object.prototype.hasOwnProperty.call(payload, "note")) {
    sanitized.note = validateRequiredText(errors, "note", payload.note, { label: "Note", min: 3, max: 500 });
  }

  if (Object.prototype.hasOwnProperty.call(payload, "reminderDateTime") || Object.prototype.hasOwnProperty.call(payload, "dueDate")) {
    sanitized.reminderDateTime = validateDate(errors, "reminderDateTime", payload.reminderDateTime || payload.dueDate, {
      label: "Reminder date/time",
      required: true,
    });
    sanitized.dueDate = sanitized.reminderDateTime;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "reminderType") || Object.prototype.hasOwnProperty.call(payload, "type")) {
    sanitized.reminderType = validateEnum(errors, "reminderType", payload.reminderType || payload.type, {
      label: "Reminder type",
      values: reminderTypes,
    });
    sanitized.type = reminderTypeToLegacyType[sanitized.reminderType];
  }

  if (Object.prototype.hasOwnProperty.call(payload, "status")) {
    sanitized.status = validateEnum(errors, "status", payload.status, {
      label: "Status",
      values: reminderStatuses,
    });
  }

  throwIfValidationFailed(errors);
  return sanitized;
};

export const validateFollowupCompletionInput = (payload) => {
  const errors = {};
  const sanitized = {
    completionNote: validateRequiredText(errors, "completionNote", payload.completionNote || payload.note, {
      label: "Completion note",
      min: 3,
      max: 500,
    }),
  };

  throwIfValidationFailed(errors);
  return sanitized;
};
