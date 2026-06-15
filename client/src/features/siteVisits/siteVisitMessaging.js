import { formatWhatsAppPhone } from "../../utils/whatsappMessage";

export const buildSiteVisitConfirmationMessage = (siteVisit) => {
  const lines = [
    "Lavista Estate Site Visit Confirmation",
    "",
    `Client: ${siteVisit.client?.ownerName || "-"}`,
    `Project: ${siteVisit.project?.projectName || siteVisit.project?.publicAlias || "-"}`,
    `Visit Time: ${new Date(siteVisit.visitDateTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`,
    `Assigned Staff: ${siteVisit.assignedStaff?.name || "-"}`,
    `Pickup Required: ${siteVisit.pickupRequired ? "Yes" : "No"}`,
  ];

  if (siteVisit.visitStatus) {
    lines.push(`Status: ${siteVisit.visitStatus}`);
  }

  if (siteVisit.clientFeedback) {
    lines.push(`Feedback: ${siteVisit.clientFeedback}`);
  }

  if (siteVisit.nextAction) {
    lines.push(`Next Action: ${siteVisit.nextAction}`);
  }

  lines.push("", "Please confirm availability for the scheduled site visit.");

  return lines.join("\n");
};

export const getSiteVisitWhatsAppUrl = (siteVisit) =>
  `https://wa.me/${formatWhatsAppPhone(siteVisit.client?.clientPhoneNumber)}?text=${encodeURIComponent(buildSiteVisitConfirmationMessage(siteVisit))}`;
