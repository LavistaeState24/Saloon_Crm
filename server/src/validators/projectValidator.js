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

const serviceCategories = [
  "Hair",
  "Skin",
  "Makeup",
  "Spa",
  "Nails",
  "Bridal",
  "Grooming",
  "Package",
  "Apartment",
  "Villa",
  "Plot",
  "Commercial",
  "Bunglow",
  "Bungalow",
  "1BHK",
  "2BHK",
  "2.5BHK",
  "3BHK",
  "4BHK",
  "5BHK",
  "6BHK",
  "Penthouse",
];

const serviceStatuses = [
  "Available",
  "Not Available",
  "By Appointment Only",
];

const serviceCategoryMap = {
  Hair: "Hair",
  Skin: "Skin",
  Makeup: "Makeup",
  Spa: "Spa",
  Nails: "Nails",
  Bridal: "Bridal",
  Grooming: "Grooming",
  Package: "Package",
  Apartment: "Apartment",
  Villa: "Villa",
  Plot: "Plot",
  Commercial: "Commercial",
  Bunglow: "Bunglow",
  Bungalow: "Bungalow",
  "1BHK": "1BHK",
  "2BHK": "2BHK",
  "2.5BHK": "2.5BHK",
  "3BHK": "3BHK",
  "4BHK": "4BHK",
  "5BHK": "5BHK",
  "6BHK": "6BHK",
  Penthouse: "Penthouse",
};

const normalizeServiceCategories = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => serviceCategoryMap[String(item).trim()] || String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .map((item) => serviceCategoryMap[item] || item)
      .filter(Boolean);
  }

  return [];
};

const parseSessionTime = (value) => {
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

  const sessionTimeLabel = validateRequiredText(
    errors,
    "sizeRange.label",
    payload.sizeRange?.label || payload.sizeRange?.min,
    {
      label: "Service duration / session time",
      min: 1,
      max: 50,
    }
  );

  const parsedSessionTime = parseSessionTime(sessionTimeLabel);

  const sessionTimeMin = validateNumber(errors, "sizeRange.min", parsedSessionTime.min, {
    label: "Minimum session time",
    required: true,
    min: 1,
  });

  const sessionTimeMax = validateNumber(errors, "sizeRange.max", parsedSessionTime.max, {
    label: "Maximum session time",
    required: true,
    min: 1,
  });

  const priceMin = validateNumber(errors, "priceRange.min", payload.priceRange?.min, {
    label: "Minimum service price",
    required: false,
    min: 1,
  });

  const priceMaxInput = payload.priceRange?.max ?? payload.priceRange?.min;

  const priceMax = validateNumber(errors, "priceRange.max", priceMaxInput, {
    label: "Maximum service price",
    required: false,
    min: 1,
  });

  const totalSlots = validateNumber(errors, "totalUnits", payload.totalUnits, {
    label: "Total slots",
    required: true,
    min: 1,
    integer: true,
  });

  const availableSlots = validateNumber(errors, "availableUnits", payload.availableUnits, {
    label: "Available slots",
    required: false,
    min: 0,
    integer: true,
  });

  const normalizedServiceCategories = normalizeServiceCategories(payload.propertyType);

  const includes = Array.isArray(payload.amenities)
    ? payload.amenities.map((item) => String(item).trim()).filter(Boolean)
    : String(payload.amenities || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  if (!includes.length) {
    errors.amenities = "Includes is required";
  }

  if (
    normalizedServiceCategories.length &&
    normalizedServiceCategories.some((item) => !serviceCategories.includes(item))
  ) {
    errors.propertyType = "Service category is invalid";
  }

  if (sessionTimeMin !== undefined && sessionTimeMax !== undefined && sessionTimeMax < sessionTimeMin) {
    errors["sizeRange.max"] = "Maximum session time must be greater than or equal to minimum session time";
  }

  if (priceMin !== undefined && priceMax !== undefined && priceMax < priceMin) {
    errors["priceRange.max"] = "Maximum service price must be greater than or equal to minimum service price";
  }

  if (totalSlots !== undefined && availableSlots !== undefined && availableSlots > totalSlots) {
    errors.availableUnits = "Available slots cannot exceed total slots";
  }

  const hasServiceVideo = Boolean(payload.hasSampleVideo);

  const serviceVideoUrl =
    validateOptionalUrl(errors, "sampleVideoUrl", payload.sampleVideoUrl, "Service video URL") || undefined;

  if (hasServiceVideo && !serviceVideoUrl) {
    errors.sampleVideoUrl = "Service video URL is required";
  }

  if (!hasServiceVideo && payload.sampleVideoUrl) {
    errors.sampleVideoUrl = "Service video URL must be empty when no video is available";
  }

  const brochure = payload.brochure
    ? {
        name:
          validateOptionalText(errors, "brochure.name", payload.brochure.name, {
            label: "Brochure name",
            min: 1,
            max: 120,
          }) || undefined,
        url:
          validateOptionalAssetUrl(errors, "brochure.url", payload.brochure.url, "Brochure URL") ||
          undefined,
      }
    : undefined;

  const sanitized = {
    // Backend keys are still old for compatibility
    projectName: validateRequiredText(errors, "projectName", payload.projectName, {
      label: "Service name",
      min: 3,
      max: 100,
    }),

    publicAlias: validateRequiredText(errors, "publicAlias", payload.publicAlias, {
      label: "Display name",
      min: 3,
      max: 100,
    }),

    location: validateRequiredText(errors, "location", payload.location, {
      label: "Branch",
      min: 2,
      max: 100,
    }),

    area: validateRequiredText(errors, "area", payload.area, {
      label: "Branch area",
      min: 2,
      max: 80,
    }),

    propertyType: normalizedServiceCategories,

    configuration: validateRequiredText(errors, "configuration", payload.configuration, {
      label: "Duration",
      min: 2,
      max: 60,
    }),

    sizeRange: {
      label: sessionTimeLabel,
      min: sessionTimeMin,
      max: sessionTimeMax,
      unit: "min",
    },

    priceRange: {
      min: priceMin,
      max: priceMin !== undefined && priceMax === undefined ? priceMin : priceMax,
      currencyLabel: "INR",
    },

    totalPlotSize:
      validateOptionalText(errors, "totalPlotSize", payload.totalPlotSize, {
        label: "Total stock or capacity",
        max: 50,
      }) || undefined,

    totalBlocks: validateNumber(errors, "totalBlocks", payload.totalBlocks, {
      label: "Total branches",
      required: true,
      min: 0,
      integer: true,
    }),

    totalUnits: totalSlots,

    availableUnits: availableSlots,

    possessionDate: validateDate(errors, "possessionDate", payload.possessionDate, {
      label: "Availability date",
      required: true,
    }),

    amenities: includes,

    brochure,

    hasSampleVideo: hasServiceVideo,

    sampleVideoUrl: hasServiceVideo ? serviceVideoUrl : null,

    internalNotes:
      validateOptionalText(errors, "internalNotes", payload.internalNotes, {
        label: "Internal notes",
        max: 500,
      }) || undefined,

    builderDetails:
      validateOptionalText(errors, "builderDetails", payload.builderDetails, {
        label: "Service provider details",
        max: 300,
      }) || undefined,

    status: validateEnum(errors, "status", payload.status || "Available", {
      label: "Service availability",
      values: serviceStatuses,
    }),
  };

  throwIfValidationFailed(errors);
  return sanitized;
};
