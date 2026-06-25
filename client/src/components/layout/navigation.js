import {
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck,
  LayoutDashboard,
  Receipt,
  Scissors,
  Settings,
  SquareUserRound,
  UserCog,
  Users,
} from "lucide-react";

import { industryLabels } from "../../config/industryLabels";

export const navigationItems = [
  {
    to: "/dashboard",
    label: industryLabels.navigation.dashboard,
    icon: LayoutDashboard,
    moduleKey: "dashboard",
    actionKey: "view",
  },
  {
    to: "/customers",
    label: industryLabels.navigation.customers,
    icon: Users,
    moduleKey: "clients",
    actionKey: "view",
  },
  {
    to: "/services",
    label: industryLabels.navigation.services,
    icon: Scissors,
    moduleKey: "projects",
    actionKey: "view",
  },
  {
    to: "/appointments",
    label: industryLabels.navigation.appointments,
    icon: CalendarCheck,
    moduleKey: "siteVisits",
    actionKey: "view",
  },
  {
    to: "/billing/all",
    label: industryLabels.navigation.billing,
    icon: Receipt,
    moduleKey: "deals",
    actionKey: "view",
  },
  {
    to: "/followups",
    label: industryLabels.navigation.followups,
    icon: BriefcaseBusiness,
    moduleKey: "followups",
    actionKey: "view",
  },
  {
    to: "/billing/reports",
    label: industryLabels.navigation.reports,
    icon: BarChart3,
    moduleKey: "deals",
    actionKey: "view",
  },
  {
    to: "/settings/users",
    label: industryLabels.navigation.staff,
    icon: UserCog,
    moduleKey: "settings",
    actionKey: "view",
  },
  {
    to: "/settings",
    label: industryLabels.navigation.settings,
    icon: Settings,
    moduleKey: "settings",
    actionKey: "view",
  },
];

export const profileIcon = SquareUserRound;
