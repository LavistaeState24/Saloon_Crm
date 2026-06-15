export const siteVisitStatusOptions = ["Planned", "Done", "Cancelled", "Rescheduled"];

export const postVisitResultOptions = ["Interested", "Negotiation", "Not Interested", "Revisit Required"];

export const getSiteVisitStatusTone = (status) => {
  if (status === "Done") return "green";
  if (status === "Cancelled") return "rose";
  if (status === "Rescheduled") return "amber";
  return "slate";
};

export const formatSiteVisitDateTime = (value) =>
  value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-";
