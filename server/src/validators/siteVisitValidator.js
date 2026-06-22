import {
  throwIfValidationFailed,
  validateDate,
  validateEnum,
  validateObjectId,
  validateOptionalText,
  validateRequiredText,
} from "./common.js";

const appointmentStatuses = [
  "Booked",
  "Confirmed",
  "Completed",
  "Cancelled",
  "No Show",
  "Rescheduled",
];

const appointmentResults = [
  "Service Completed",
  "Customer Interested",
  "Follow-up Required",
  "Rescheduled",
  "Cancelled",
  "No Show",
];

export const validateSiteVisitInput = (payload) => {
  const errors = {};

  const visitStatus =
    validateEnum(errors, "visitStatus", payload.visitStatus || "Booked", {
      label: "Appointment status",
      values: appointmentStatuses,
      required: false,
    }) || "Booked";

  const sanitized = {
    client: validateObjectId(errors, "client", payload.client || payload.leadId, {
      label: "Customer",
    }),
    project: validateObjectId(errors, "project", payload.project || payload.projectId, {
      label: "Service",
    }),
    assignedStaff: validateObjectId(errors, "assignedStaff", payload.assignedStaff, {
      label: "Assigned staff",
    }),
    visitDateTime: validateDate(errors, "visitDateTime", payload.visitDateTime, {
      label: "Appointment date/time",
      required: true,
    }),
    pickupRequired: Boolean(payload.pickupRequired),
    visitStatus,
    postVisitResult:
      validateEnum(errors, "postVisitResult", payload.postVisitResult, {
        label: "Appointment result",
        values: appointmentResults,
        required: false,
      }) || undefined,
    clientFeedback:
      validateOptionalText(errors, "clientFeedback", payload.clientFeedback, {
        label: "Customer feedback",
        min: 3,
        max: 1000,
      }) || "",
    nextAction:
      validateOptionalText(errors, "nextAction", payload.nextAction, {
        label: "Next follow-up",
        min: 3,
        max: 500,
      }) || "",
  };

  if (visitStatus === "Completed") {
    sanitized.clientFeedback = validateRequiredText(errors, "clientFeedback", payload.clientFeedback, {
      label: "Customer feedback",
      min: 3,
      max: 1000,
    });

    sanitized.nextAction = validateRequiredText(errors, "nextAction", payload.nextAction, {
      label: "Next follow-up",
      min: 3,
      max: 500,
    });
  }

  throwIfValidationFailed(errors);
  return sanitized;
};

export const validateSiteVisitUpdateInput = (payload) => {
  const errors = {};
  const sanitized = {};

  if (Object.prototype.hasOwnProperty.call(payload, "client") || Object.prototype.hasOwnProperty.call(payload, "leadId")) {
    sanitized.client = validateObjectId(errors, "client", payload.client || payload.leadId, {
      label: "Customer",
    });
  }

  if (Object.prototype.hasOwnProperty.call(payload, "project") || Object.prototype.hasOwnProperty.call(payload, "projectId")) {
    sanitized.project = validateObjectId(errors, "project", payload.project || payload.projectId, {
      label: "Service",
    });
  }

  if (Object.prototype.hasOwnProperty.call(payload, "assignedStaff")) {
    sanitized.assignedStaff = validateObjectId(errors, "assignedStaff", payload.assignedStaff, {
      label: "Assigned staff",
    });
  }

  if (Object.prototype.hasOwnProperty.call(payload, "visitDateTime")) {
    sanitized.visitDateTime = validateDate(errors, "visitDateTime", payload.visitDateTime, {
      label: "Appointment date/time",
      required: true,
    });
  }

  if (Object.prototype.hasOwnProperty.call(payload, "pickupRequired")) {
    sanitized.pickupRequired = Boolean(payload.pickupRequired);
  }

  if (Object.prototype.hasOwnProperty.call(payload, "visitStatus")) {
    sanitized.visitStatus = validateEnum(errors, "visitStatus", payload.visitStatus, {
      label: "Appointment status",
      values: appointmentStatuses,
    });
  }

  if (Object.prototype.hasOwnProperty.call(payload, "postVisitResult")) {
    sanitized.postVisitResult =
      validateEnum(errors, "postVisitResult", payload.postVisitResult, {
        label: "Appointment result",
        values: appointmentResults,
        required: false,
      }) || "";
  }

  if (Object.prototype.hasOwnProperty.call(payload, "clientFeedback")) {
    sanitized.clientFeedback =
      validateOptionalText(errors, "clientFeedback", payload.clientFeedback, {
        label: "Customer feedback",
        min: 3,
        max: 1000,
      }) || "";
  }

  if (Object.prototype.hasOwnProperty.call(payload, "nextAction")) {
    sanitized.nextAction =
      validateOptionalText(errors, "nextAction", payload.nextAction, {
        label: "Next follow-up",
        min: 3,
        max: 500,
      }) || "";
  }

  const finalStatus = sanitized.visitStatus || payload.visitStatus;

  if (finalStatus === "Completed") {
    const feedback = sanitized.clientFeedback ?? payload.clientFeedback;
    const action = sanitized.nextAction ?? payload.nextAction;

    sanitized.clientFeedback = validateRequiredText(errors, "clientFeedback", feedback, {
      label: "Customer feedback",
      min: 3,
      max: 1000,
    });

    sanitized.nextAction = validateRequiredText(errors, "nextAction", action, {
      label: "Next follow-up",
      min: 3,
      max: 500,
    });
  }

  throwIfValidationFailed(errors);
  return sanitized;
};

export const validateSiteVisitListQuery = (payload) => {
  const errors = {};
  const sanitized = {
    leadId:
      validateObjectId(errors, "leadId", payload.leadId || payload.clientId || payload.client, {
        label: "Customer",
        required: false,
      }) || undefined,
    projectId:
      validateObjectId(errors, "projectId", payload.projectId || payload.project, {
        label: "Service",
        required: false,
      }) || undefined,
    assignedStaff:
      validateObjectId(errors, "assignedStaff", payload.assignedStaff || payload.staff, {
        label: "Assigned staff",
        required: false,
      }) || undefined,
    visitStatus:
      validateEnum(errors, "visitStatus", payload.visitStatus, {
        label: "Appointment status",
        values: appointmentStatuses,
        required: false,
      }) || undefined,
    dateFrom: validateDate(errors, "dateFrom", payload.dateFrom, {
      label: "From date",
      required: false,
    }),
    dateTo: validateDate(errors, "dateTo", payload.dateTo, {
      label: "To date",
      required: false,
    }),
    page: payload.page,
    limit: payload.limit,
    today:
      payload.today === undefined || payload.today === ""
        ? undefined
        : String(payload.today) === "true"
          ? "true"
          : String(payload.today) === "false"
            ? "false"
            : null,
    pickupRequired:
      payload.pickupRequired === undefined || payload.pickupRequired === ""
        ? undefined
        : String(payload.pickupRequired) === "true"
          ? "true"
          : String(payload.pickupRequired) === "false"
            ? "false"
            : null,
  };

  if (sanitized.today === null) {
    errors.today = "Today must be true or false";
  }

  if (sanitized.pickupRequired === null) {
    errors.pickupRequired = "Staff assigned / assistance required must be true or false";
  }

  throwIfValidationFailed(errors);
  return sanitized;
};