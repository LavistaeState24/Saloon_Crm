export const leadImportFields = [
  {
    key: "clientName",
    label: "Client Name",
    required: true,
    aliases: ["clientname", "client", "name", "leadname", "customername", "ownername", "fullname", "leadowner", "contactname"],
  },
  {
    key: "phone",
    label: "Phone",
    required: true,
    aliases: ["phone", "mobile", "phonenumber", "mobilenumber", "clientphone", "clientphonenumber", "contact", "contactno", "whatsapp", "whatsappnumber"],
  },
  { key: "email", label: "Email", required: false, aliases: ["email", "emailid", "clientemail"] },
  { key: "propertyType", label: "Property Type", required: false, aliases: ["propertytype", "type", "bhk", "configuration"] },
  { key: "requirementType", label: "Requirement Type", required: false, aliases: ["requirementtype", "requirement", "lookingfor", "propertyrequirement"] },
  { key: "budget", label: "Budget", required: false, aliases: ["budget", "budgetrange", "budgetamount", "price", "value"] },
  { key: "budgetMin", label: "Budget Min", required: false, aliases: ["budgetmin", "minbudget", "budgetfrom", "startingbudget", "minprice"] },
  { key: "budgetMax", label: "Budget Max", required: false, aliases: ["budgetmax", "maxbudget", "budgetto", "endingbudget", "maxprice"] },
  { key: "areaPreference", label: "Area Preference", required: false, aliases: ["areapreference", "area", "preferredarea", "locality", "location"] },
  { key: "source", label: "Source", required: false, aliases: ["source", "leadsource", "campaign", "platform"] },
  { key: "assignedStaff", label: "Assigned Staff", required: false, aliases: ["assignedstaff", "assignedto", "staff", "salesperson", "salesexecutive"] },
  { key: "leadStatus", label: "Lead Status", required: false, aliases: ["leadstatus", "status"] },
  { key: "interestLevel", label: "Interest Level", required: false, aliases: ["interestlevel", "interest"] },
  { key: "notes", label: "Notes", required: false, aliases: ["notes", "remarks", "remark", "comment", "comments", "description", "message"] },
];

export const leadImportSourceOptions = [
  "Import",
  "Facebook",
  "Instagram",
  "Housing.com",
  "99acres",
  "MagicBricks",
  "Rental",
  "Broker",
  "Reseller",
  "Manual Excel",
];

const normalizeHeader = (value) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9.]/g, "");

const normalizeCell = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return typeof value === "string" ? value.trim() : String(value).trim();
};

export const normalizeImportPhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }

  return digits;
};

export const inferImportColumnMap = (headers = []) => {
  const normalizedHeaders = headers.map((header) => ({ header, normalized: normalizeHeader(header) }));

  return leadImportFields.reduce((mapping, field) => {
    const matchedHeader = normalizedHeaders.find(
      ({ normalized }) => field.aliases.includes(normalized) || normalized === normalizeHeader(field.label) || normalized === normalizeHeader(field.key),
    );

    mapping[field.key] = matchedHeader?.header || "";
    return mapping;
  }, {});
};

export const parseLeadImportFile = async (file) => {
  const XLSX = await import("xlsx");
  const extension = String(file.name || "").split(".").pop().toLowerCase();
  const workbook =
    extension === "csv"
      ? XLSX.read(await file.text(), { type: "string" })
      : XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const headers = rows.length ? Object.keys(rows[0]) : [];

  return {
    fileName: file.name,
    headers,
    rows: rows.map((row, index) => ({
      rowNumber: index + 2,
      ...Object.entries(row).reduce((accumulator, [key, value]) => {
        accumulator[key] = normalizeCell(value);
        return accumulator;
      }, {}),
    })),
  };
};

export const mapImportRows = (rows, columnMap, fallbackSource = "Import") =>
  rows.map((row, index) => {
    const getValue = (field) => {
      const sourceHeader = columnMap[field];
      return sourceHeader ? normalizeCell(row[sourceHeader]) : "";
    };

    return {
      rowNumber: row.rowNumber || index + 2,
      clientName: getValue("clientName"),
      phone: normalizeImportPhone(getValue("phone")),
      email: getValue("email"),
      propertyType: getValue("propertyType"),
      requirementType: getValue("requirementType"),
      budget: getValue("budget"),
      budgetMin: getValue("budgetMin"),
      budgetMax: getValue("budgetMax"),
      areaPreference: getValue("areaPreference"),
      source: getValue("source") || fallbackSource,
      assignedStaff: getValue("assignedStaff"),
      leadStatus: getValue("leadStatus") || "New Lead",
      interestLevel: getValue("interestLevel") || "Warm",
      notes: getValue("notes"),
    };
  });

export const previewMappedRows = (rows, columnMap, fallbackSource = "Import") => mapImportRows(rows, columnMap, fallbackSource).slice(0, 5);
