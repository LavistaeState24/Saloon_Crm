const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizePropertyTypeToken = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");

const expandPropertyTypeCategory = (value) => {
  const normalized = normalizePropertyTypeToken(value);

  switch (normalized) {
    case "apartment":
      return ["1bhk", "2bhk", "2.5bhk", "3bhk", "4bhk", "5bhk", "1 bhk", "2 bhk", "2.5 bhk", "3 bhk", "4 bhk"];
    case "villa":
      return ["bungalow", "raw house", "tenament", "penthouse"];
    case "plot":
      return ["plot"];
    case "commercial":
      return ["office", "showroom", "commercial"];
    default:
      return [normalized];
  }
};

export const buildProjectFilters = (query) => {
  const filters = {};

  if (query.area) {
    const areaPattern = escapeRegex(query.area);
    filters.$or = [{ area: { $regex: areaPattern, $options: "i" } }, { location: { $regex: areaPattern, $options: "i" } }];
  }

  if (query.propertyType) {
    console.log("SELECTED CATEGORY:", query.propertyType);

    const categoryMap = {
      Apartment: ["Apartment"],
      Villa: ["Villa", "Villa / Bungalow"],
      Plot: ["Plot"],
      Commercial: ["Commercial", "Office", "Showroom"],
      Duplex: ["Duplex"],
      Penthouse: ["Penthouse", "Penthouse + Duplex", "penthouse"],
    };

    const values = categoryMap[query.propertyType] || [query.propertyType];

    filters.configuration = {
      $in: values.map(
        (value) => new RegExp(`^${escapeRegex(value)}$`, "i")
      ),
    };
  }

  if (query.bhk) {
    const bhkPattern = escapeRegex(query.bhk);

    filters.propertyType = {
      $regex: bhkPattern,
      $options: "i",
    };
  }

  if (query.status) {
    filters.status = query.status;
  }

  if (query.availability === "true") {
    filters.availableUnits = { $gt: 0 };
  }

  if (query.minBudget || query.maxBudget) {
    filters["priceRange.min"] = {};
    if (query.minBudget) {
      filters["priceRange.min"].$gte = Number(query.minBudget);
    }
    if (query.maxBudget) {
      filters["priceRange.min"].$lte = Number(query.maxBudget);
    }
  }

  if (query.minSize || query.maxSize) {
    filters["sizeRange.min"] = {};
    if (query.minSize) {
      filters["sizeRange.min"].$gte = Number(query.minSize);
    }
    if (query.maxSize) {
      filters["sizeRange.min"].$lte = Number(query.maxSize);
    }
  }

  if (query.possession) {
    filters.possessionDate = { $lte: new Date(query.possession) };
  }

  if (query.amenities) {
    const amenities = String(query.amenities)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (amenities.length) {
      filters.amenities = { $all: amenities };
    }
  }

  return filters;
};

export const buildPagination = (query) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};
