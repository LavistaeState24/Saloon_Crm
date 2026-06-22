export const siteVisitStatusOptions = [
  "Booked",
  "Confirmed",
  "Completed",
  "Cancelled",
  "No Show",
  "Rescheduled",
];

export const postVisitResultOptions = [
  "Service Completed",
  "Customer Interested",
  "Follow-up Required",
  "Rescheduled",
  "Cancelled",
  "No Show",
];

export const getSiteVisitStatusTone = (status) => {
  if (status === "Completed") return "green";
  if (status === "Cancelled") return "rose";
  if (status === "Rescheduled") return "amber";
  if (status === "Confirmed") return "blue";
  if (status === "Booked") return "slate";
  if (status === "No Show") return "rose";

  return "slate";
};

export const formatSiteVisitDateTime = (value) =>
  value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-";
