import {
  throwIfValidationFailed,
  validateDate,
  validateEmail,
  validateEnum,
  validateNumber,
  validateObjectId,
  validateOptionalText,
  validatePhone,
  validateRequiredText,
} from "./common.js";

const customerSourceOptions = [
  "Walk-in",
  "Referral",
  "Instagram",
  "Facebook",
  "Google",
  "WhatsApp",
  "Phone",
  "Website",
  "Other",
];
const customerTypeOptions = [
  "Walk-in",
  "Regular",
  "VIP",
  "Bridal",
  "Corporate",
];
const serviceInterestedOptions = [
  "",
  "Haircut",
  "Hair Color",
  "Facial",
  "Cleanup",
  "Spa",
  "Makeup",
  "Bridal Package",
  "Nail Art",
  "Grooming",
];
const customerStatusOptions = [
  "New Customer",
  "Contacted",
  "Appointment Planned",
  "Service Completed",
  "Follow-up Pending",
  "Converted",
  "Lost",
];
const interestLevelValues = ["Hot", "Warm", "Cold"];
const shareChannelValues = ["WhatsApp", "Copy"];
const reminderTypeValues = ["Call", "WhatsApp", "Details Send", "Site Visit", "Payment", "Document"];
const matchingSortValues = ["matchScore", "priceLowToHigh", "priceHighToLow", "possessionSoonest", "newest"];
const salesAllowedUpdateFields = [
  "leadStatus",
  "interestLevel",
  "notes",
  "internalNotes",
  "lastCallStatus",
  "nextFollowUpDate",
];

const hasOwnProperty = (payload, field) => Object.prototype.hasOwnProperty.call(payload, field);

const validateNullableDate = (errors, field, value, { label }) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  return validateDate(errors, field, value, { label, required: false });
};

export const validateClientInput = (payload, options = {}) => {
  const { partial = false, allowedFields = null } = options;
  const errors = {};
  const fields = allowedFields || [
    "ownerName",
    "address",
    "premiseName",
    "premiseArea",
    "sourceOfProperty",
    "propertyType",
    "ownerPrice",
    "propertyCondition",
    "propertyAge",
    "propertySize",
    "clientPhoneNumber",
    "email",
    "internalNotes",
    "propertyStatus",
    "dateOfAddingProperty",
    "assignedStaff",
    "leadStatus",
    "interestLevel",
    "source",
    "purpose",
    "budgetMin",
    "budgetMax",
    "requirementType",
    "areaPreference",
    "notes",
    "lastCallStatus",
    "nextFollowUpDate",
  ];
  const shouldValidateField = (field) => fields.includes(field) && (!partial || hasOwnProperty(payload, field));

  const sanitized = {
    ...(shouldValidateField("ownerName")
      ? { ownerName: validateRequiredText(errors, "ownerName", payload.ownerName, { label: "Customer name", min: 3, max: 80 }) }
      : {}),
    ...(shouldValidateField("address")
      ? { address: validateRequiredText(errors, "address", payload.address, { label: "Address", min: 5, max: 200 }) }
      : {}),
    ...(shouldValidateField("premiseName")
      ? { premiseName: validateOptionalText(errors, "premiseName", payload.premiseName, { label: "Premise name", required: false, max: 100 }) }
      : {}),
    ...(shouldValidateField("premiseArea")
      ? { premiseArea: validateRequiredText(errors, "premiseArea", payload.premiseArea, { label: "Premise area", min: 2, max: 80 }) }
      : {}),
    ...(shouldValidateField("sourceOfProperty")
      ? {
        sourceOfProperty: validateEnum(errors, "sourceOfProperty", payload.sourceOfProperty, {
          label: "Source",
          values: customerSourceOptions,
        })
      }
      : {}),
    ...(shouldValidateField("propertyType")
      ? { propertyType: validateEnum(errors, "propertyType", payload.propertyType, { label: "Customer type", values: customerTypeOptions }) }
      : {}),
    ...(shouldValidateField("ownerPrice")
      ? { ownerPrice: validateNumber(errors, "ownerPrice", payload.ownerPrice, { label: "Expected spend", required: false, min: 0 }) }
      : {}),
    ...(shouldValidateField("propertyCondition")
      ? {
        propertyCondition: validateOptionalText(errors, "propertyCondition", payload.propertyCondition, {
          label: "Service interested",
          required: false,
          max: 80,
        })
      }
      : {}),
    ...(shouldValidateField("propertyAge")
      ? { propertyAge: validateRequiredText(errors, "propertyAge", payload.propertyAge, { label: "Property age", min: 1, max: 80 }) }
      : {}),
    ...(shouldValidateField("propertySize")
      ? { propertySize: validateOptionalText(errors, "propertySize", payload.propertySize, { label: "Size of property", max: 80 }) }
      : {}),
    ...(shouldValidateField("clientPhoneNumber")
      ? {
        clientPhoneNumber: validatePhone(errors, "clientPhoneNumber", payload.clientPhoneNumber, {
          requiredMessage: "Client phone number is required",
          invalidMessage: "Client phone number must be a valid 10-digit Indian mobile number",
        })
      }
      : {}),
    ...(shouldValidateField("email")
      ? { email: validateEmail(errors, "email", payload.email, { required: false }) }
      : {}),
    ...(shouldValidateField("internalNotes")
      ? { internalNotes: validateOptionalText(errors, "internalNotes", payload.internalNotes, { label: "Internal notes", max: 500 }) }
      : {}),
    ...(shouldValidateField("propertyStatus")
      ? {
        propertyStatus: validateEnum(errors, "propertyStatus", payload.propertyStatus, {
          label: "Customer status",
          values: customerStatusOptions,
        })
      }
      : {}),
    ...(shouldValidateField("dateOfAddingProperty")
      ? {
        dateOfAddingProperty: validateDate(errors, "dateOfAddingProperty", payload.dateOfAddingProperty, {
          label: "Date of adding property",
          required: true,
        }),
      }
      : {}),
    ...(shouldValidateField("assignedStaff")
      ? { assignedStaff: validateObjectId(errors, "assignedStaff", payload.assignedStaff, { label: "Assigned staff", required: false }) || null }
      : {}),
    ...(shouldValidateField("leadStatus")
      ? { leadStatus: validateEnum(errors, "leadStatus", payload.leadStatus, { label: "Customer status", values: customerStatusOptions }) }
      : {}),
    ...(shouldValidateField("interestLevel")
      ? {
        interestLevel: validateEnum(errors, "interestLevel", payload.interestLevel, {
          label: "Interest level",
          values: interestLevelValues,
        })
      }
      : {}),
    ...(shouldValidateField("source")
      ? { source: validateOptionalText(errors, "source", payload.source, { label: "Lead source", max: 100 }) }
      : {}),
    ...(shouldValidateField("purpose")
      ? { purpose: validateOptionalText(errors, "purpose", payload.purpose, { label: "Purpose", max: 80 }) }
      : {}),
    ...(shouldValidateField("budgetMin")
      ? { budgetMin: validateNumber(errors, "budgetMin", payload.budgetMin, { label: "Minimum budget", required: false, min: 0 }) }
      : {}),
    ...(shouldValidateField("budgetMax")
      ? { budgetMax: validateNumber(errors, "budgetMax", payload.budgetMax, { label: "Maximum budget", required: false, min: 0 }) }
      : {}),
    ...(shouldValidateField("requirementType")
      ? {
        requirementType: validateEnum(errors, "requirementType", payload.requirementType, {
          label: "Service interested",
          values: serviceInterestedOptions,
          required: false,
        })
      }
      : {}),
    ...(shouldValidateField("areaPreference")
      ? { areaPreference: validateOptionalText(errors, "areaPreference", payload.areaPreference, { label: "Area preference", max: 120 }) }
      : {}),
    ...(shouldValidateField("notes")
      ? { notes: validateOptionalText(errors, "notes", payload.notes, { label: "Notes", max: 2000 }) }
      : {}),
    ...(shouldValidateField("lastCallStatus")
      ? { lastCallStatus: validateOptionalText(errors, "lastCallStatus", payload.lastCallStatus, { label: "Last call status", max: 120 }) }
      : {}),
    ...(shouldValidateField("nextFollowUpDate")
      ? { nextFollowUpDate: validateNullableDate(errors, "nextFollowUpDate", payload.nextFollowUpDate, { label: "Next follow-up date" }) }
      : {}),
  };

  if (sanitized.budgetMin !== undefined && sanitized.budgetMax !== undefined && sanitized.budgetMax < sanitized.budgetMin) {
    errors.budgetMax = "Maximum budget must be at least minimum budget";
  }

  throwIfValidationFailed(errors);
  return sanitized;
};

export const validateClientUpdateInput = (payload, currentUser) => {
  if (currentUser.role === "sales") {
    const invalidFields = Object.keys(payload).filter((field) => !salesAllowedUpdateFields.includes(field));

    if (invalidFields.length) {
      throwIfValidationFailed({
        [invalidFields[0]]: "Sales users can only update pipeline follow-up fields",
      });
    }

    return validateClientInput(payload, {
      partial: true,
      allowedFields: salesAllowedUpdateFields,
    });
  }

  return validateClientInput(payload, { partial: true });
};

export const validateClientMatchingQuery = (payload) => {
  const errors = {};
  const sanitized = {
    area: validateOptionalText(errors, "area", payload.area, { label: "Area", max: 120 }) || undefined,
    propertyType: validateOptionalText(errors, "propertyType", payload.propertyType, { label: "Customer type", max: 120 }) || undefined,
    bhk: validateOptionalText(errors, "bhk", payload.bhk, { label: "BHK", max: 80 }) || undefined,
    possession: validateOptionalText(errors, "possession", payload.possession, { label: "Possession", max: 80 }) || undefined,
    status: validateOptionalText(errors, "status", payload.status, { label: "Status", max: 40 }) || undefined,
    availability:
      payload.availability === undefined || payload.availability === null || payload.availability === ""
        ? undefined
        : String(payload.availability).trim(),
    page: validateNumber(errors, "page", payload.page, { label: "Page", required: false, min: 1, integer: true }),
    limit: validateNumber(errors, "limit", payload.limit, { label: "Limit", required: false, min: 1, max: 100, integer: true }),
    minBudget: validateNumber(errors, "minBudget", payload.minBudget, { label: "Minimum budget", required: false, min: 0 }),
    maxBudget: validateNumber(errors, "maxBudget", payload.maxBudget, { label: "Maximum budget", required: false, min: 0 }),
    minSize: validateNumber(errors, "minSize", payload.minSize, { label: "Minimum size", required: false, min: 0 }),
    maxSize: validateNumber(errors, "maxSize", payload.maxSize, { label: "Maximum size", required: false, min: 0 }),
    sortBy: validateEnum(errors, "sortBy", payload.sortBy, { label: "Sort by", values: matchingSortValues, required: false }) || undefined,
    sortOrder: validateEnum(errors, "sortOrder", payload.sortOrder, { label: "Sort order", values: ["asc", "desc"], required: false }) || undefined,
  };

  if (sanitized.availability && !["true", "false"].includes(sanitized.availability)) {
    errors.availability = "Availability must be true or false";
  }

  if (sanitized.minBudget !== undefined && sanitized.maxBudget !== undefined && sanitized.maxBudget < sanitized.minBudget) {
    errors.maxBudget = "Maximum budget must be at least minimum budget";
  }

  if (sanitized.minSize !== undefined && sanitized.maxSize !== undefined && sanitized.maxSize < sanitized.minSize) {
    errors.maxSize = "Maximum size must be at least minimum size";
  }

  throwIfValidationFailed(errors);
  return sanitized;
};

export const validateClientProjectShareInput = (payload) => {
  const errors = {};
  const rawProjectIds = Array.isArray(payload.projectIds) ? payload.projectIds : [];
  const projectIds = rawProjectIds
    .map((value, index) => validateObjectId(errors, `projectIds.${index}`, value, { label: `Project ${index + 1}` }))
    .filter(Boolean);

  const sanitized = {
    projectIds,
    shareChannel: validateEnum(errors, "shareChannel", payload.shareChannel, { label: "Share channel", values: shareChannelValues }),
    clientRequirement:
      validateOptionalText(errors, "clientRequirement", payload.clientRequirement, { label: "Client requirement", max: 200 }) || undefined,
    reminderType: validateEnum(errors, "reminderType", payload.reminderType, { label: "Reminder type", values: reminderTypeValues }),
    reminderDateTime: validateDate(errors, "reminderDateTime", payload.reminderDateTime, {
      label: "Reminder date/time",
      required: true,
      future: true,
    }),
    reminderNote: validateRequiredText(errors, "reminderNote", payload.reminderNote, { label: "Reminder note", min: 3, max: 500 }),
  };

  if (!projectIds.length) {
    errors.projectIds = "At least one project is required";
  }

  throwIfValidationFailed(errors);
  return sanitized;
};
