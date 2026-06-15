import {
  throwIfValidationFailed,
  validateDate,
  validateObjectId,
  validateOptionalText,
} from "./common.js";

const allowedFields = [
  "publicAlias",
  "location",
  "propertyType",
  "configuration",
  "sizeRange",
  "priceRange",
  "possessionDate",
  "amenities",
  "brochure",
  "sampleHouseVideoUrl",
  "projectImages",
  "status",
];

export const validateShareLinkInput = (payload) => {
  const errors = {};
  const selectedFields = Array.isArray(payload.selectedFields) ? payload.selectedFields : [];

  selectedFields.forEach((field) => {
    if (!allowedFields.includes(field)) {
      errors.selectedFields = "Selected fields contain invalid values";
    }
  });

  const sanitized = {
    projectId: validateObjectId(errors, "projectId", payload.projectId, { label: "Project" }),
    sharedWithClientName:
      validateOptionalText(errors, "sharedWithClientName", payload.sharedWithClientName, {
        label: "Client name",
        min: 3,
        max: 60,
      }) || undefined,
    selectedFields,
    expiresAt: validateDate(errors, "expiresAt", payload.expiresAt, { label: "Expiry date", future: true }),
  };

  throwIfValidationFailed(errors);
  return sanitized;
};
