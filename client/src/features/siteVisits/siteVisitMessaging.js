import { formatWhatsAppPhone } from "../../utils/whatsappMessage";

export const buildSiteVisitConfirmationMessage = (siteVisit) => {
  const lines = [
    "Lavista Salon Appointment Confirmation",
    "",
    `Customer: ${siteVisit.client?.ownerName || "-"}`,
    `Service: ${siteVisit.project?.projectName || siteVisit.project?.publicAlias || "-"}`,
    `Appointment Time: ${new Date(siteVisit.visitDateTime).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    })}`,
    `Assigned Staff: ${siteVisit.assignedStaff?.name || "-"}`,
    `Assistance Required: ${siteVisit.pickupRequired ? "Yes" : "No"}`,
  ];

  if (siteVisit.visitStatus) {
    lines.push(`Appointment Status: ${siteVisit.visitStatus}`);
  }

  if (siteVisit.clientFeedback) {
    lines.push(`Customer Feedback: ${siteVisit.clientFeedback}`);
  }

  if (siteVisit.nextAction) {
    lines.push(`Next Follow-up: ${siteVisit.nextAction}`);
  }

  lines.push(
    "",
    "Please confirm your availability for the scheduled appointment."
  );

  return lines.join("\n");
};

export const getSiteVisitWhatsAppUrl = (siteVisit) =>
  `https://wa.me/${formatWhatsAppPhone(siteVisit.client?.clientPhoneNumber)}?text=${encodeURIComponent(buildSiteVisitConfirmationMessage(siteVisit))}`;
