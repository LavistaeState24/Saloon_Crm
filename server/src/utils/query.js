const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const buildProjectFilters = (query) => {
  const filters = {};

  // Branch / Branch Area search
  if (query.area) {
    const branchPattern = escapeRegex(query.area);

    filters.$or = [
      { area: { $regex: branchPattern, $options: "i" } },
      { location: { $regex: branchPattern, $options: "i" } },
    ];
  }

  // Service Category
  if (query.propertyType) {
    filters.propertyType = {
      $in: [new RegExp(`^${escapeRegex(query.propertyType)}$`, "i")],
    };
  }

  // Duration
  // Frontend still sends this as "bhk" for compatibility
  if (query.bhk) {
    filters.configuration = {
      $regex: escapeRegex(query.bhk),
      $options: "i",
    };
  }

  // Service Availability
  if (query.status) {
    filters.status = query.status;
  }

  // Available Slots
  if (query.availability === "true") {
    filters.availableUnits = { $gt: 0 };
  }

  // Service Price
  if (query.minBudget || query.maxBudget) {
    filters["priceRange.min"] = {};

    if (query.minBudget) {
      filters["priceRange.min"].$gte = Number(query.minBudget);
    }

    if (query.maxBudget) {
      filters["priceRange.min"].$lte = Number(query.maxBudget);
    }
  }

  // Service Duration / Session Time
  if (query.minSize || query.maxSize) {
    filters["sizeRange.min"] = {};

    if (query.minSize) {
      filters["sizeRange.min"].$gte = Number(query.minSize);
    }

    if (query.maxSize) {
      filters["sizeRange.min"].$lte = Number(query.maxSize);
    }
  }

  // Availability Date
  if (query.possession) {
    filters.possessionDate = { $lte: new Date(query.possession) };
  }

  // Includes
  if (query.amenities) {
    const includes = String(query.amenities)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (includes.length) {
      filters.amenities = { $all: includes };
    }
  }

  return filters;
};

export const buildPagination = (query) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};