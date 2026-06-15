export const dealStatusOptions = ["Negotiation", "Booking", "Closed", "Cancelled"];

export const paymentStatusOptions = ["Pending", "Token Paid", "Partially Paid", "Paid", "Refunded"];

export const getDealStatusTone = (status) => {
  if (status === "Closed") return "green";
  if (status === "Booking") return "amber";
  if (status === "Cancelled") return "rose";
  return "gold";
};

export const getPaymentStatusTone = (status) => {
  if (status === "Paid") return "green";
  if (status === "Partially Paid" || status === "Token Paid") return "amber";
  if (status === "Refunded") return "rose";
  return "slate";
};

export const formatCurrency = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) {
    return "-";
  }

  return amount.toLocaleString("en-IN");
};

export const formatDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN") : "-");

export const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-";
