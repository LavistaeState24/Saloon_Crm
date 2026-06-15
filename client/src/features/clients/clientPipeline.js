export const getInterestLevelTone = (interestLevel) => {
  switch (interestLevel) {
    case "Hot":
      return "rose";
    case "Warm":
      return "amber";
    case "Cold":
    default:
      return "blue";
  }
};

export const formatCompactPrice = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "";
  }

  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(amount % 10000000 === 0 ? 0 : 1)} Cr`;
  }

  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)} Lac`;
  }

  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`;
  }

  return amount.toString();
};

export const formatBudgetRange = (budgetMin, budgetMax) => {
  const hasBudgetValue = (value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
  const min = hasBudgetValue(budgetMin) ? Number(budgetMin).toLocaleString("en-IN") : "";
  const max = hasBudgetValue(budgetMax) ? Number(budgetMax).toLocaleString("en-IN") : "";

  if (min && max) {
    return `${min} - ${max}`;
  }

  return min || max || "-";
};
