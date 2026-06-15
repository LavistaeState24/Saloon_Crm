const formatShareLine = (label, value) => (value ? `- ${label}: ${value}` : null);

export const buildClientSafeShareMessage = (safeProjects = [], contact = {}) => {
  const lines = ["Premium Property Details by Lavista Estate", ""];

  safeProjects.forEach((project, index) => {
    const amenitiesValue = project.amenities?.length ? project.amenities.join(", ") : null;
    const photosValue = project.photos?.length ? project.photos.join(", ") : null;

    lines.push(`Option ${index + 1}`);
    lines.push(
      ...[
        formatShareLine("Area", project.area),
        formatShareLine("Configuration", project.configuration),
        formatShareLine("Size", project.size),
        formatShareLine("Price Range", project.priceRange),
        formatShareLine("Possession", project.possession),
        formatShareLine("Basic Amenities", amenitiesValue),
        formatShareLine("Brochure", project.brochureUrl),
        formatShareLine("Sample House Video", project.sampleVideoUrl),
        formatShareLine("Photos", photosValue),
      ].filter(Boolean),
    );
    lines.push("");
  });

  lines.push("For more details, contact:");

  if (contact.name) {
    lines.push(contact.name);
  }

  if (contact.phone) {
    lines.push(contact.phone);
  }

  lines.push("", "Lavista Estate | WhatsApp for site visit and latest availability");

  return lines.filter(Boolean).join("\n");
};
