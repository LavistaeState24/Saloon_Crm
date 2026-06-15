import {
  BriefcaseBusiness,
  Building2,
  FolderPlus,
  LayoutDashboard,
  MessageSquareShare,
  Settings,
  SquareUserRound,
  TicketCheck,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { industryLabels } from "../../config/industryLabels";

export const navigationItems = [
  { to: "/dashboard", label: industryLabels.navigation.overview, icon: LayoutDashboard, moduleKey: "dashboard", actionKey: "view" },
  { to: "/projects", label: industryLabels.navigation.services, icon: Building2, moduleKey: "projects", actionKey: "view" },
  { to: "/projects/new", label: industryLabels.navigation.addService, icon: FolderPlus, moduleKey: "projects", actionKey: "create" },
  { to: "/clients", label: industryLabels.navigation.customers, icon: Users, moduleKey: "clients", actionKey: "view" },
  { to: "/positive-clients", label: industryLabels.navigation.priorityCustomers, icon: UserCheck, moduleKey: "clients", actionKey: "view" },
  { to: "/clients/new", label: industryLabels.navigation.addCustomer, icon: UserPlus, moduleKey: "clients", actionKey: "create" },
  { to: "/followups", label: industryLabels.navigation.reminders, icon: BriefcaseBusiness, moduleKey: "followups", actionKey: "view" },
  { to: "/site-visits", label: industryLabels.navigation.appointments, icon: TicketCheck, moduleKey: "siteVisits", actionKey: "view" },
  { to: "/deals/negotiation", label: industryLabels.navigation.consultations, icon: BriefcaseBusiness, moduleKey: "deals", actionKey: "view", group: industryLabels.navigation.billing },
  { to: "/deals/bookings", label: industryLabels.navigation.bookings, icon: BriefcaseBusiness, moduleKey: "deals", actionKey: "view", group: industryLabels.navigation.billing },
  { to: "/deals/closed", label: industryLabels.navigation.closedInvoices, icon: BriefcaseBusiness, moduleKey: "deals", actionKey: "view", group: industryLabels.navigation.billing },
  { to: "/deals/revenue-summary", label: industryLabels.navigation.salonReports, icon: BriefcaseBusiness, moduleKey: "dealReports", actionKey: "view", group: industryLabels.navigation.billing },
  { to: "/shared-history", label: industryLabels.navigation.sharedHistory, icon: MessageSquareShare, moduleKey: "shareRecords", actionKey: "view" },
  { to: "/settings", label: industryLabels.navigation.settings, icon: Settings, moduleKey: "settings", actionKey: "view" },
];

export const profileIcon = SquareUserRound;
