const industryLabelMap = {
  dashboard: "Dashboard",
  projects: "Services",
  project: "Service",
  clients: "Customers",
  client: "Customer",
  leads: "Customers",
  lead: "Customer",
  positiveClients: "Priority Customers",
  followups: "Follow-ups",
  followup: "Reminder",
  siteVisits: "Appointments",
  siteVisit: "Appointment",
  deals: "Billing",
  deal: "Invoice",
  dealReports: "Billing Reports",
  reports: "Reports",
  users: "Staff",
  user: "Staff Member",
  settings: "Settings",
  booking: "Booking",
  negotiation: "Consultation",
  revenue: "Revenue",
  summary: "Summary",
};

export const industryLabels = {
  appName: "Salon CRM",
  brandName: "Lavista Salon",
  brandTagline: "Complete Salon Management Platform",
  footerTitle: "Salon Management System",
  footerDescription:
    "Manage customers, services, appointments, billing, reminders, staff, and business reports.",
  billing: "Billing",
  breadcrumbs: {
    dashboard: "Dashboard",

    // Legacy keys
    projects: "Services",
    project: "Service",
    clients: "Customers",
    client: "Customer",
    deals: "Billing",
    deal: "Invoice",
    siteVisits: "Appointments",
    siteVisit: "Appointment",

    // New salon route keys
    services: "Services",
    service: "Service",
    customers: "Customers",
    customer: "Customer",
    billing: "Billing",
    appointments: "Appointments",
    appointment: "Appointment",

    // Billing pages
    all: "All Invoices",
    draft: "Draft",
    issued: "Issued",
    paid: "Paid",

    // Other
    leads: "Customers",
    followups: "Follow-ups",
    reminders: "Follow-ups",
    reports: "Reports",
    settings: "Settings",
    users: "Staff",
    user: "Staff Member",
    new: "Add Service",
    edit: "Edit Service",
    booking: "Booking",
    consultation: "Consultation",
  },
  navigation: {
    overview: "Dashboard",
    dashboard: "Dashboard",
    services: "Services",
    addService: "Add Service",
    customers: "Customers",
    priorityCustomers: "Priority Customers",
    addCustomer: "Add Customer",
    billing: "Billing",
    followups: "Follow-ups",
    reports: "Reports",
    staff: "Staff",
    settings: "Settings",
    reminders: "Follow-ups",
    appointments: "Appointments",
    paidInvoices: "Paid Invoices",
    consultations: "Consultations",
    bookings: "Bookings",
    closedInvoices: "Paid Invoices",
    salonReports: "Salon Reports",
    sharedHistory: "Shared History",
  },
  dashboard: {
    customers: "Customers",
    services: "Services",
    appointments: "Appointments",
    billing: "Billing",
    reminders: "Follow-ups",
    salonReports: "Salon Reports",
  },
  reports: {
    billing: "Billing Reports",
    staffPerformance: "Staff Performance",
    customerSource: "Customer Source",
    billingRevenue: "Billing Revenue",
    appointments: "Appointment Reports",
  },
  dashboardCards: {
    totalCustomers: "Total Customers",
    todaysAppointments: "Today's Appointments",
    pendingFollowups: "Pending Follow-ups",
    paidInvoices: "Paid Invoices",
    monthlyRevenue: "Monthly Billing Revenue",
  },
  actions: {
    addCustomer: "Add Customer",
    addService: "Add Service",
    addAppointment: "Add Appointment",
    addInvoice: "Add Invoice",
    createCustomer: "Create Customer",
    createService: "Create Service",
    createAppointment: "Create Appointment",
    createInvoice: "Create Invoice",
    updateCustomer: "Update Customer",
    updateService: "Update Service",
    updateAppointment: "Update Appointment",
    updateInvoice: "Update Invoice",
  },
};

export const salonFormLabels = {
  customerName: "Customer Name",
  serviceInterested: "Service Interested",
  customerType: "Customer Type",
  expectedSpendMin: "Expected Spend Min",
  expectedSpendMax: "Expected Spend Max",
  preferredBranch: "Preferred Branch",
  customerStatus: "Customer Status",
  priorityLevel: "Priority Level",
  notes: "Notes",
};

export const salonCustomerTypeOptions = ["Walk-in", "Regular", "VIP", "Bridal", "Corporate"];
export const salonServiceInterestedOptions = [
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
export const salonCustomerStatusOptions = [
  "New Customer",
  "Contacted",
  "Appointment Planned",
  "Service Completed",
  "Follow-up Pending",
  "Converted",
  "Lost",
];

export const salonPriorityLevelOptions = ["Hot", "Warm", "Cold"];

export const normalizeSalonCustomerStatus = (value) => value || "";

export const getIndustryLabel = (key, fallback = "") => industryLabelMap[key] || fallback || key;
