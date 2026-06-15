import { industryLabels } from "../config/industryLabels";

export const permissionModules = [
  { key: "dashboard", label: "Overview" },
  { key: "projects", label: industryLabels.dashboard.services },
  { key: "clients", label: industryLabels.dashboard.customers },
  { key: "followups", label: industryLabels.dashboard.reminders },
  { key: "siteVisits", label: industryLabels.dashboard.appointments },
  { key: "deals", label: industryLabels.dashboard.billing },
  { key: "dealReports", label: industryLabels.dashboard.salonReports },
  { key: "shareRecords", label: "Share Records" },
  { key: "users", label: "Staff" },
  { key: "reports", label: industryLabels.dashboard.salonReports },
  { key: "settings", label: "Settings" },
];

export const permissionActions = ["view", "create", "update", "delete", "scope"];

export const roleOptions = [
  { value: "super-admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "sales", label: "Sales Executive" },
];

export const assignableRoleOptions = roleOptions.filter((role) => role.value !== "super-admin");
