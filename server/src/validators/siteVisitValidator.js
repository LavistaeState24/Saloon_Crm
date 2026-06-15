import {
  throwIfValidationFailed,
  validateDate,
  validateEnum,
  validateObjectId,
  validateOptionalText,
  validateRequiredText,
} from "./common.js";

const visitStatuses = ["Planned", "Done", "Cancelled", "Rescheduled"];

const postVisitResults = [
  "Interested",
  "Negotiation",
  "Not Interested",
  "Revisit Required",
];

export const validateSiteVisitInput = (payload) => {
  const errors = {};

  const visitStatus =
    validateEnum(errors, "visitStatus", payload.visitStatus || "Planned", {
      label: "Visit status",
      values: visitStatuses,
      required: false,
    }) || "Planned";

  const sanitized = {
    client: validateObjectId(errors, "client", payload.client || payload.leadId, {
      label: "Client",
    }),
    project: validateObjectId(errors, "project", payload.project || payload.projectId, {
      label: "Project",
    }),
    assignedStaff: validateObjectId(errors, "assignedStaff", payload.assignedStaff, {
      label: "Assigned staff",
    }),
    visitDateTime: validateDate(errors, "visitDateTime", payload.visitDateTime, {
      label: "Visit date/time",
      required: true,
    }),
    pickupRequired: Boolean(payload.pickupRequired),
    visitStatus,
    postVisitResult:
      validateEnum(errors, "postVisitResult", payload.postVisitResult, {
        label: "Post visit result",
        values: postVisitResults,
        required: false,
      }) || undefined,
    clientFeedback:
      validateOptionalText(errors, "clientFeedback", payload.clientFeedback, {
        label: "Client feedback",
        min: 3,
        max: 1000,
      }) || "",
    nextAction:
      validateOptionalText(errors, "nextAction", payload.nextAction, {
        label: "Next action",
        min: 3,
        max: 500,
      }) || "",
  };

  if (visitStatus === "Done") {
    sanitized.clientFeedback = validateRequiredText(errors, "clientFeedback", payload.clientFeedback, {
      label: "Client feedback",
      min: 3,
      max: 1000,
    });

    sanitized.nextAction = validateRequiredText(errors, "nextAction", payload.nextAction, {
      label: "Next action",
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
      label: "Client",
    });
  }

  if (Object.prototype.hasOwnProperty.call(payload, "project") || Object.prototype.hasOwnProperty.call(payload, "projectId")) {
    sanitized.project = validateObjectId(errors, "project", payload.project || payload.projectId, {
      label: "Project",
    });
  }

  if (Object.prototype.hasOwnProperty.call(payload, "assignedStaff")) {
    sanitized.assignedStaff = validateObjectId(errors, "assignedStaff", payload.assignedStaff, {
      label: "Assigned staff",
    });
  }

  if (Object.prototype.hasOwnProperty.call(payload, "visitDateTime")) {
    sanitized.visitDateTime = validateDate(errors, "visitDateTime", payload.visitDateTime, {
      label: "Visit date/time",
      required: true,
    });
  }

  if (Object.prototype.hasOwnProperty.call(payload, "pickupRequired")) {
    sanitized.pickupRequired = Boolean(payload.pickupRequired);
  }

  if (Object.prototype.hasOwnProperty.call(payload, "visitStatus")) {
    sanitized.visitStatus = validateEnum(errors, "visitStatus", payload.visitStatus, {
      label: "Visit status",
      values: visitStatuses,
    });
  }

  if (Object.prototype.hasOwnProperty.call(payload, "postVisitResult")) {
    sanitized.postVisitResult =
      validateEnum(errors, "postVisitResult", payload.postVisitResult, {
        label: "Post visit result",
        values: postVisitResults,
        required: false,
      }) || "";
  }

  if (Object.prototype.hasOwnProperty.call(payload, "clientFeedback")) {
    sanitized.clientFeedback =
      validateOptionalText(errors, "clientFeedback", payload.clientFeedback, {
        label: "Client feedback",
        min: 3,
        max: 1000,
      }) || "";
  }

  if (Object.prototype.hasOwnProperty.call(payload, "nextAction")) {
    sanitized.nextAction =
      validateOptionalText(errors, "nextAction", payload.nextAction, {
        label: "Next action",
        min: 3,
        max: 500,
      }) || "";
  }

  const finalStatus = sanitized.visitStatus || payload.visitStatus;

  if (finalStatus === "Done") {
    const feedback = sanitized.clientFeedback ?? payload.clientFeedback;
    const action = sanitized.nextAction ?? payload.nextAction;

    sanitized.clientFeedback = validateRequiredText(errors, "clientFeedback", feedback, {
      label: "Client feedback",
      min: 3,
      max: 1000,
    });

    sanitized.nextAction = validateRequiredText(errors, "nextAction", action, {
      label: "Next action",
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
    leadId: validateObjectId(errors, "leadId", payload.leadId || payload.clientId || payload.client, {
      label: "Lead",
      required: false,
    }) || undefined,
    projectId: validateObjectId(errors, "projectId", payload.projectId || payload.project, {
      label: "Project",
      required: false,
    }) || undefined,
    assignedStaff: validateObjectId(errors, "assignedStaff", payload.assignedStaff || payload.staff, {
      label: "Assigned staff",
      required: false,
    }) || undefined,
    visitStatus:
      validateEnum(errors, "visitStatus", payload.visitStatus, {
        label: "Visit status",
        values: visitStatuses,
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
    errors.pickupRequired = "Pickup required must be true or false";
  }

  throwIfValidationFailed(errors);
  return sanitized;
};
