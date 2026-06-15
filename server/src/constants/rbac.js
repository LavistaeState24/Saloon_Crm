export const roleKeys = ["super-admin", "admin", "manager", "sales"];

export const moduleKeys = [
  "dashboard",
  "projects",
  "clients",
  "followups",
  "siteVisits",
  "deals",
  "dealReports",
  "shareRecords",
  "users",
  "reports",
  "settings",
];

export const actionKeys = ["view", "create", "update", "delete"];

export const scopeKeys = ["all", "assigned", "own", "none"];

const createPermission = ({
  view = false,
  create = false,
  update = false,
  delete: canDelete = false,
  scope = "none",
} = {}) => ({
  view,
  create,
  update,
  delete: canDelete,
  scope,
});

export const roleLabels = {
  "super-admin": "Super Admin",
  admin: "Admin",
  manager: "Manager",
  sales: "Sales Executive",
};

export const buildDefaultPermissions = (roleKey) => {
  switch (roleKey) {
    case "super-admin":
      return {
        dashboard: createPermission({ view: true, create: true, update: true, delete: true, scope: "all" }),
        projects: createPermission({ view: true, create: true, update: true, delete: true, scope: "all" }),
        clients: createPermission({ view: true, create: true, update: true, delete: true, scope: "all" }),
        followups: createPermission({ view: true, create: true, update: true, delete: true, scope: "all" }),
        siteVisits: createPermission({ view: true, create: true, update: true, delete: true, scope: "all" }),
        deals: createPermission({ view: true, create: true, update: true, delete: true, scope: "all" }),
        dealReports: createPermission({ view: true, scope: "all" }),
        shareRecords: createPermission({ view: true, create: true, update: true, delete: true, scope: "all" }),
        users: createPermission({ view: true, create: true, update: true, delete: true, scope: "all" }),
        reports: createPermission({ view: true, create: true, update: true, delete: true, scope: "all" }),
        settings: createPermission({ view: true, create: true, update: true, delete: true, scope: "all" }),
      };

    case "admin":
      return {
        dashboard: createPermission({ view: true, scope: "all" }),
        projects: createPermission({ view: true, create: true, update: true, delete: true, scope: "all" }),
        clients: createPermission({ view: true, create: true, update: true, delete: true, scope: "all" }),
        followups: createPermission({ view: true, create: true, update: true, delete: true, scope: "all" }),
        siteVisits: createPermission({ view: true, create: true, update: true, delete: true, scope: "all" }),
        deals: createPermission({ view: true, create: true, update: true, delete: true, scope: "all" }),
        dealReports: createPermission({ view: true, scope: "all" }),
        shareRecords: createPermission({ view: true, create: true, update: true, delete: true, scope: "all" }),
        users: createPermission({ view: true, create: true, update: true, delete: false, scope: "all" }),
        reports: createPermission({ view: true, scope: "all" }),
        settings: createPermission({ view: false, scope: "none" }),
      };

    case "manager":
      return {
        dashboard: createPermission({ view: true, scope: "assigned" }),
        projects: createPermission({ view: true, scope: "all" }),
        clients: createPermission({ view: true, create: true, update: true, delete: false, scope: "assigned" }),
        followups: createPermission({ view: true, create: true, update: true, delete: false, scope: "assigned" }),
        siteVisits: createPermission({ view: true, create: true, update: true, delete: false, scope: "assigned" }),
        deals: createPermission({ view: true, create: true, update: true, delete: false, scope: "assigned" }),
        dealReports: createPermission({ view: true, scope: "all" }),
        shareRecords: createPermission({ view: true, create: true, update: true, delete: false, scope: "assigned" }),
        users: createPermission({ scope: "none" }),
        reports: createPermission({ scope: "none" }),
        settings: createPermission({ scope: "none" }),
      };

    case "sales":
    default:
      return {
        dashboard: createPermission({ view: true, scope: "own" }),
        projects: createPermission({ view: true, scope: "all" }),
        clients: createPermission({ view: true, create:true, update: true, delete: false, scope: "assigned" }),
        followups: createPermission({ view: true, create: true, update: true, delete: false, scope: "own" }),
        siteVisits: createPermission({ view: true, create: true, update: true, delete: false, scope: "own" }),
        deals: createPermission({ view: true, create: true, update: true, delete: false, scope: "own" }),
        dealReports: createPermission({ view: false, scope: "none" }),
        shareRecords: createPermission({ view: true, create: true, update: false, delete: false, scope: "own" }),
        users: createPermission({ scope: "none" }),
        reports: createPermission({ scope: "none" }),
        settings: createPermission({ scope: "none" }),
      };
  }
};

export const buildRoleDefinition = (roleKey) => ({
  key: roleKey,
  name: roleLabels[roleKey],
  isSystem: true,
  permissions: buildDefaultPermissions(roleKey),
});

