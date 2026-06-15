import {
  throwIfValidationFailed,
  validateDate,
  validateEnum,
  validateNumber,
  validateOptionalText,
  validateRequiredText,
} from "./common.js";

const leadStatusValues = [
  "New Lead",
  "Call Pending",
  "Connected",
  "Requirement Taken",
  "Details Sent",
  "Follow-up Pending",
  "Positive",
  "Site Visit Planned",
  "Negotiation",
  "Booking",
  "Closed",
  "Lost",
];
const interestLevelValues = ["Hot", "Warm", "Cold"];
const reminderTypeValues = ["None", "Call", "WhatsApp", "Details Send", "Site Visit", "Payment", "Document"];

const toBoolean = (value) => value === true || value === "true";

export const validateCallLogInput = (payload) => {
  const errors = {};
  const callConnected = toBoolean(payload.callConnected);
  const leadStatus = validateEnum(errors, "leadStatus", payload.leadStatus, {
    label: "Lead status",
    values: leadStatusValues,
  });
  const nextFollowupDateTime = payload.nextFollowupDateTime
    ? validateDate(errors, "nextFollowupDateTime", payload.nextFollowupDateTime, {
        label: "Next follow-up date/time",
      })
    : null;

  const sanitized = {
    callConnected,
    leadStatus,
    interestLevel: validateEnum(errors, "interestLevel", payload.interestLevel, {
      label: "Interest level",
      values: interestLevelValues,
      required: false,
    }),
    discussionSummary: validateRequiredText(errors, "discussionSummary", payload.discussionSummary, {
      label: "Discussion summary",
      min: 3,
      max: 2000,
    }),
    requirementNote: validateOptionalText(errors, "requirementNote", payload.requirementNote, {
      label: "Requirement note",
      max: 1000,
    }),
    objection: validateOptionalText(errors, "objection", payload.objection, {
      label: "Objection",
      max: 1000,
    }),
    nextAction: validateOptionalText(errors, "nextAction", payload.nextAction, {
      label: "Next action",
      max: 200,
    }),
    nextFollowupDateTime,
    reminderType: validateEnum(errors, "reminderType", payload.reminderType, {
      label: "Reminder type",
      values: reminderTypeValues,
      required: false,
    }),
    callDuration: validateNumber(errors, "callDuration", payload.callDuration, {
      label: "Call duration",
      required: false,
      min: 0,
    }),
    lostReason: validateOptionalText(errors, "lostReason", payload.lostReason, {
      label: "Lost reason",
      max: 1000,
    }),
  };

  if (callConnected && !sanitized.requirementNote) {
    errors.requirementNote = "Requirement note is required when call is connected";
  }

  if (!["Closed", "Lost"].includes(leadStatus) && !nextFollowupDateTime) {
    errors.nextFollowupDateTime = "Next follow-up date/time is required unless lead is Closed or Lost";
  }

  if (leadStatus === "Lost" && !sanitized.lostReason) {
    errors.lostReason = "Lost reason is required when lead status is Lost";
  }

  throwIfValidationFailed(errors);
  return sanitized;
};
