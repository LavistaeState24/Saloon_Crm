import {
  throwIfValidationFailed,
  validateDate,
  validateEnum,
  validateNumber,
  validateObjectId,
  validateOptionalText,
  validateRequiredText,
} from "./common.js";

const dealStatuses = ["Negotiation", "Booking", "Closed", "Cancelled"];
const paymentStatuses = ["Pending", "Partial", "Paid", "Refunded"];

const validateDocumentsPending = (value) => {
  if (value === true || value === "true" || value === 1 || value === "1") {
    return true;
  }

  return false;
};

const validateDealCore = (payload, errors, { currentUser, isUpdate = false } = {}) => {
  const hasField = (field) => Object.prototype.hasOwnProperty.call(payload, field);
  const dealStatus =
    validateEnum(errors, "dealStatus", payload.dealStatus || (isUpdate ? undefined : "Negotiation"), {
      label: "Invoice status",
      values: dealStatuses,
      required: !isUpdate,
    }) || (isUpdate ? undefined : "Negotiation");

  const sanitized = {};

  if (!isUpdate || hasField("leadId") || hasField("client") || hasField("clientId")) {
    sanitized.leadId = validateObjectId(errors, "leadId", payload.leadId || payload.client || payload.clientId, {
      label: "Lead",
      required: !isUpdate,
    });
  }

  if (!isUpdate || hasField("finalProject") || hasField("projectId")) {
    sanitized.finalProject = validateObjectId(errors, "finalProject", payload.finalProject || payload.projectId, {
      label: "Final service",
      required: !isUpdate,
    });
  }

  if (hasField("finalUnit")) {
    sanitized.finalUnit =
      validateOptionalText(errors, "finalUnit", payload.finalUnit, {
        label: "Service / Package detail",
        min: 1,
        max: 100,
      }) || "";
  }

  if (hasField("finalPrice")) {
    sanitized.finalPrice = validateNumber(errors, "finalPrice", payload.finalPrice, {
      label: "Bill amount",
      required: false,
      min: 0,
    });
  }

  if (hasField("brokerageDetails")) {
    sanitized.brokerageDetails =
      validateOptionalText(errors, "brokerageDetails", payload.brokerageDetails, {
        label: "Service notes",
        min: 3,
        max: 1000,
      }) || "";
  }

  if (hasField("tokenAmount")) {
    sanitized.tokenAmount = validateNumber(errors, "tokenAmount", payload.tokenAmount, {
      label: "Advance paid",
      required: false,
      min: 0,
    });
  }

  if (hasField("bookingDate")) {
    sanitized.bookingDate = validateDate(errors, "bookingDate", payload.bookingDate, {
      label: "Billing date",
      required: false,
    });
  }

  if (hasField("paymentStatus")) {
    sanitized.paymentStatus =
      validateEnum(errors, "paymentStatus", payload.paymentStatus, {
        label: "Payment status",
        values: paymentStatuses,
        required: false,
      }) || "Pending";
  }

  if (hasField("documentsPending")) {
    sanitized.documentsPending = validateDocumentsPending(payload.documentsPending);
  }

  if (hasField("dealClosedBy") || (!isUpdate && dealStatus === "Closed")) {
    sanitized.dealClosedBy = validateObjectId(errors, "dealClosedBy", payload.dealClosedBy || currentUser?._id, {
      label: "Billed by",
      required: dealStatus === "Closed",
    }) || undefined;
  }

  if (hasField("dealStatus") || !isUpdate) {
    sanitized.dealStatus = dealStatus;
  }

  if (hasField("notes")) {
    sanitized.notes =
      validateOptionalText(errors, "notes", payload.notes, {
        label: "Notes",
        min: 0,
        max: 2000,
      }) || "";
  }

  if ((sanitized.dealStatus || dealStatus) === "Closed") {
    sanitized.finalPrice = validateNumber(errors, "finalPrice", sanitized.finalPrice ?? payload.finalPrice, {
      label: "Bill amount",
      required: true,
      min: 0,
    });
    sanitized.brokerageDetails = validateRequiredText(errors, "brokerageDetails", sanitized.brokerageDetails ?? payload.brokerageDetails, {
      label: "Service notes",
      min: 3,
      max: 1000,
    });
    sanitized.bookingDate = validateDate(errors, "bookingDate", sanitized.bookingDate ?? payload.bookingDate, {
      label: "Billing date",
      required: true,
    });
    sanitized.dealClosedBy = validateObjectId(errors, "dealClosedBy", sanitized.dealClosedBy ?? payload.dealClosedBy ?? currentUser?._id, {
      label: "Billed by",
      required: true,
    });
  }

  throwIfValidationFailed(errors);
  return sanitized;
};

export const validateDealInput = (payload, currentUser) => validateDealCore(payload, {}, { currentUser, isUpdate: false });

export const validateDealUpdateInput = (payload, currentUser) => {
  const errors = {};
  const sanitized = validateDealCore(payload, errors, { currentUser, isUpdate: true });
  throwIfValidationFailed(errors);
  return sanitized;
};

export const validateDealListQuery = (payload) => {
  console.log("Deal List Query:", payload);
  const errors = {};
  const sanitized = {
    leadId:
      validateObjectId(errors, "leadId", payload.leadId || payload.clientId || payload.client, {
        label: "Lead",
        required: false,
      }) || undefined,
    finalProject:
      validateObjectId(errors, "finalProject", payload.finalProject || payload.projectId || payload.project, {
        label: "Final service",
        required: false,
      }) || undefined,
    dealStatus:
      validateEnum(errors, "dealStatus", payload.dealStatus || payload.status, {
        label: "Invoice status",
        values: dealStatuses,
        required: false,
      }) || undefined,
    paymentStatus:
      validateEnum(errors, "paymentStatus", payload.paymentStatus, {
        label: "Payment status",
        values: paymentStatuses,
        required: false,
      }) || undefined,
    dealClosedBy:
      validateObjectId(errors, "dealClosedBy", payload.dealClosedBy, {
        label: "Billed by",
        required: false,
      }) || undefined,
    dateFrom: validateDate(errors, "dateFrom", payload.dateFrom, { label: "From date", required: false }) || undefined,
    dateTo: validateDate(errors, "dateTo", payload.dateTo, { label: "To date", required: false }) || undefined,
    search:
      validateOptionalText(errors, "search", payload.search, {
        label: "Search",
        min: 1,
        max: 120,
      }) || undefined,
    documentsPending:
      payload.documentsPending === undefined || payload.documentsPending === ""
        ? undefined
        : String(payload.documentsPending) === "true"
          ? "true"
          : String(payload.documentsPending) === "false"
            ? "false"
            : null,
    page: payload.page,
    limit: payload.limit,
  };

  if (sanitized.documentsPending === null) {
    errors.documentsPending = "Pending items must be true or false";
  }

  throwIfValidationFailed(errors);
  return sanitized;
};

export const validateDealReportQuery = (payload) => {
  const errors = {};
  const sanitized = {
    dateFrom: validateDate(errors, "dateFrom", payload.dateFrom, { label: "From date", required: false }) || undefined,
    dateTo: validateDate(errors, "dateTo", payload.dateTo, { label: "To date", required: false }) || undefined,
  };

  throwIfValidationFailed(errors);
  return sanitized;
};
