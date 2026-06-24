export const dealStatusOptions = [
  { value: "Negotiation", label: "Draft" },
  { value: "Booking", label: "Issued" },
  { value: "Closed", label: "Paid" },
  { value: "Cancelled", label: "Cancelled" },
];

export const paymentStatusOptions = ["Pending", "Partial", "Paid", "Refunded"];

export const getDealStatusLabel = (status) => {
  const labels = {
    Negotiation: "Draft",
    Booking: "Issued",
    Closed: "Paid",
    Cancelled: "Cancelled",
  };

  return labels[status] || status || "-";
};

export const getDealStatusTone = (status) => {
  if (status === "Closed") return "green";
  if (status === "Booking") return "amber";
  if (status === "Cancelled") return "rose";
  return "gold";
};

export const getPaymentStatusTone = (status) => {
  if (status === "Paid") return "green";
  if (status === "Partial") return "amber";
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

export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN") : "-";

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "-";