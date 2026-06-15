import {
  throwIfValidationFailed,
  validateDate,
  validateEnum,
  validateNumber,
  validateOptionalAssetUrl,
  validateOptionalText,
  validateOptionalUrl,
  validateRequiredText,
} from "./common.js";

const propertyTypes = ["1BHK", "2BHK", "2.5BHK", "3BHK", "4BHK", "5BHK", "6BHK","Villa","Plot", "Commercial"];
const projectStatuses = ["active", "sold out", "upcoming"];
const propertyTypeMap = {
  "1 BHK": "1BHK",
  "2 BHK": "2BHK",
  "2.5 BHK": "2.5BHK",
  "3 BHK": "3BHK",
  "4 BHK": "4BHK",
  "5 BHK": "5BHK",
  "6 BHK": "6BHK",
  "Villa": "Villa",
  "Plot": "Plot",
  "Commercial": "Commercial",
};

const normalizePropertyTypes = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => propertyTypeMap[String(item).trim()] || String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .map((item) => propertyTypeMap[item] || item)
      .filter(Boolean);
  }

  return [];
};

const parseSizeRange = (value) => {
  const normalized = String(value || "")
    .trim()
    .replace(/[â€“â€”]/g, "-")
    .replace(/\bto\b/gi, "-");
  const matches = normalized.match(/\d+(\.\d+)?/g) || [];

  if (!normalized || !matches.length) {
    return { normalized, min: undefined, max: undefined };
  }

  const numbers = matches.map(Number).filter((item) => !Number.isNaN(item));
  const min = numbers[0];
  const max = numbers[1] ?? numbers[0];

  return { normalized, min, max };
};

export const validateProjectInput = (payload) => {
  const errors = {};

  const sizeLabel = validateRequiredText(errors, "sizeRange.label", payload.sizeRange?.label || payload.sizeRange?.min, {
    label: "Size",
    min: 1,
    max: 50,
  });
  const parsedSizeRange = parseSizeRange(sizeLabel);
  const sizeMin = validateNumber(errors, "sizeRange.min", parsedSizeRange.min, { label: "Minimum size", required: true, min: 1 });
  const sizeMax = validateNumber(errors, "sizeRange.max", parsedSizeRange.max, { label: "Maximum size", required: true, min: 1 });
  const priceMin = validateNumber(errors, "priceRange.min", payload.priceRange?.min, { label: "Minimum price", required: false, min: 1 });
  const priceMaxInput = payload.priceRange?.max ?? payload.priceRange?.min;
  const priceMax = validateNumber(errors, "priceRange.max", priceMaxInput, {
    label: "Maximum price",
    required: false,
    min: 1,
  });
  const totalUnits = validateNumber(errors, "totalUnits", payload.totalUnits, { label: "Total units", required: true, min: 1, integer: true });
  const availableUnits = validateNumber(errors, "availableUnits", payload.availableUnits, {
    label: "Available units",
    required: false,
    min: 0,
    integer: true,
  });
  const normalizedPropertyTypes = normalizePropertyTypes(payload.propertyType);

  const amenities =
    Array.isArray(payload.amenities)
      ? payload.amenities.map((item) => String(item).trim()).filter(Boolean)
      : String(payload.amenities || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

  if (!amenities.length) {
    errors.amenities = "Amenities is required";
  }

  if (normalizedPropertyTypes.length && normalizedPropertyTypes.some((item) => !propertyTypes.includes(item))) {
    errors.propertyType = "Property type is invalid";
  }

  if (sizeMin !== undefined && sizeMax !== undefined && sizeMax < sizeMin) {
    errors["sizeRange.max"] = "Maximum size must be greater than or equal to minimum size";
  }

  if (priceMin !== undefined && priceMax !== undefined && priceMax < priceMin) {
    errors["priceRange.max"] = "Maximum price must be greater than or equal to minimum price";
  }

  if (totalUnits !== undefined && availableUnits !== undefined && availableUnits > totalUnits) {
    errors.availableUnits = "Available units cannot exceed total units";
  }

  const hasSampleVideo = Boolean(payload.hasSampleVideo);
  const sampleVideoUrl = validateOptionalUrl(errors, "sampleVideoUrl", payload.sampleVideoUrl, "Sample house video URL") || undefined;

  if (hasSampleVideo && !sampleVideoUrl) {
    errors.sampleVideoUrl = "Sample house video URL is required";
  }

  if (!hasSampleVideo && payload.sampleVideoUrl) {
    errors.sampleVideoUrl = "Sample house video URL must be empty when no video is available";
  }

  const brochure = payload.brochure
    ? {
        name: validateOptionalText(errors, "brochure.name", payload.brochure.name, {
          label: "Brochure name",
          min: 1,
          max: 120,
        }) || undefined,
        url: validateOptionalAssetUrl(errors, "brochure.url", payload.brochure.url, "Brochure URL") || undefined,
      }
    : undefined;

  const sanitized = {
    projectName: validateRequiredText(errors, "projectName", payload.projectName, { label: "Project name", min: 3, max: 100 }),
    publicAlias: validateRequiredText(errors, "publicAlias", payload.publicAlias, { label: "Client-safe alias", min: 3, max: 100 }),
    location: validateRequiredText(errors, "location", payload.location, { label: "Location", min: 2, max: 100 }),
    area: validateRequiredText(errors, "area", payload.area, { label: "Area", min: 2, max: 80 }),
    propertyType: normalizedPropertyTypes,
    configuration: validateRequiredText(errors, "configuration", payload.configuration, { label: "Configuration", min: 3, max: 60 }),
    sizeRange: {
      label: sizeLabel,
      min: sizeMin,
      max: sizeMax,
      unit: "sqft",
    },
    priceRange: {
      min: priceMin,
      max: priceMin !== undefined && priceMax === undefined ? priceMin : priceMax,
      currencyLabel: "INR",
    },
    totalPlotSize: validateOptionalText(errors, "totalPlotSize", payload.totalPlotSize, { label: "Total plot size", max: 50 }) || undefined,
    totalBlocks: validateNumber(errors, "totalBlocks", payload.totalBlocks, { label: "Total blocks", required: true, min: 0, integer: true }),
    totalUnits,
    availableUnits,
    possessionDate: validateDate(errors, "possessionDate", payload.possessionDate, { label: "Possession date", required: true }),
    amenities,
    brochure,
    hasSampleVideo,
    sampleVideoUrl: hasSampleVideo ? sampleVideoUrl : null,
    internalNotes: validateOptionalText(errors, "internalNotes", payload.internalNotes, { label: "Internal notes", max: 500 }) || undefined,
    builderDetails: validateOptionalText(errors, "builderDetails", payload.builderDetails, { label: "Builder details", max: 300 }) || undefined,
    status: validateEnum(errors, "status", payload.status || "active", { label: "Status", values: projectStatuses }),
  };

  throwIfValidationFailed(errors);
  return sanitized;
};
