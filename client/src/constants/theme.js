
// ROLE

export const roles = [
  { value: "super-admin", label: "Super Admin" },
  { value: "admin", label: "Salon Admin" },
  { value: "manager", label: "Branch Manager" },
  { value: "receptionist", label: "Receptionist" },
  { value: "stylist", label: "Stylist" },
  { value: "beautician", label: "Beautician" },
  { value: "cashier", label: "Cashier" },
  { value: "marketing", label: "Marketing Executive" },
  { value: "inventory", label: "Inventory Manager" },
];


// CUSTOMER STATUS


export const customerStatusOptions = [
  "New Customer",
  "Contacted",
  "Appointment Planned",
  "Service Completed",
  "Follow-up Pending",
  "Converted",
  "Lost",
];

export const customerStatuses = [
  "new customer",
  "contacted",
  "appointment planned",
  "service completed",
  "follow-up pending",
  "converted",
  "lost",
];

// PRIORITY

export const priorityLevelOptions = ["Hot", "Warm", "Cold"];

// SERVICE INQUIRY

export const serviceInquiryOptions = [
  "Hair Service",
  "Skin Service",
  "Spa Service",
  "Makeup Service",
  "Bridal Service",
  "Package Inquiry",
];

export const serviceInterestedOptions = [
  "Haircut",
  "Hair Color",
  "Facial",
  "Cleanup",
  "Spa",
  "Makeup",
  "Bridal Package",
  "Nail Art",
  "Grooming",
];

// CUSTOMER SOURCE

export const customerSourceOptions = [
  "Walk-in",
  "Referral",
  "Instagram",
  "Facebook",
  "Google",
  "WhatsApp",
  "Phone",
  "Website",
];

// CUSTOMER TYPES

export const customerTypeOptions = [
  "Walk-in",
  "Regular",
  "VIP",
  "Bridal",
  "Corporate",
];


// SERVICES


export const serviceOptions = [
  "Haircut",
  "Hair Color",
  "Facial",
  "Cleanup",
  "Spa",
  "Makeup",
  "Bridal Package",
  "Nail Art",
  "Grooming",
];


// PHASE 4 - SERVICE FORM

export const serviceCategories = [
  "Hair",
  "Skin",
  "Makeup",
  "Spa",
  "Nails",
  "Bridal",
  "Grooming",
  "Package",
];

export const durationOptions = [
  "15 min",
  "30 min",
  "45 min",
  "60 min",
  "90 min",
  "120 min",
];

export const serviceAvailabilityOptions = [
  "Available",
  "Not Available",
  "By Appointment Only",
];

export const serviceSearchCategories = [
  "Hair",
  "Skin",
  "Makeup",
  "Spa",
  "Nails",
  "Bridal",
  "Grooming",
  "Package",
];


// BACKWARD COMPATIBILITY

export const propertyTypeOptions = serviceCategories;

export const projectSearchTypeOptions = serviceSearchCategories;

export const availabilityOptions = serviceAvailabilityOptions;

// SHARE RECORDS

export const shareRecordStatuses = [
  "shared",
  "interested",
  "follow-up",
  "site-visit",
  "closed",
  "not-interested",
];