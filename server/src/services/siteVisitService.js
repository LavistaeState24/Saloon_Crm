import { Client } from "../models/Client.js";
import { Project } from "../models/Project.js";
import { SiteVisit } from "../models/SiteVisit.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { buildPagination } from "../utils/query.js";
import { buildReminderLockOverrideActivity, createReminderLockError, shouldBlockReminderAction } from "../utils/reminderLock.js";
import { createActivityLog, recordSiteVisitActivity } from "./activityLogService.js";
import { hasOverdueReminderForLead } from "./reminderService.js";

const toObjectId = (value) => value?._id || value || null;
const toObjectIdString = (value) => String(toObjectId(value) || "");

const getAssignedUserId = (client) => toObjectId(client.assignedStaff) || toObjectId(client.assignedTo) || null;

const buildClientVisibilityFilter = async (currentUser) => {
  if (["super-admin", "admin"].includes(currentUser.role)) {
    return {};
  }

  if (currentUser.role === "manager") {
    const teamMembers = await User.find({
      isActive: true,
      $or: [{ _id: currentUser._id }, { role: "sales", managerId: currentUser._id }],
    }).select("_id");
    const teamUserIds = teamMembers.map((user) => user._id);

    return {
      $or: [{ assignedStaff: { $in: teamUserIds } }, { assignedTo: { $in: teamUserIds } }, { createdBy: { $in: teamUserIds } }],
    };
  }

  return {
    $or: [{ assignedStaff: currentUser._id }, { assignedTo: currentUser._id }],
  };
};

const assertClientAccess = async (client, currentUser) => {
  if (["super-admin", "admin"].includes(currentUser.role)) {
    return;
  }

  if (currentUser.role === "manager") {
    const relatedUserIds = [getAssignedUserId(client), toObjectId(client.createdBy)].filter(Boolean);
    const managedSalesCount = await User.countDocuments({
      role: "sales",
      managerId: currentUser._id,
      _id: { $in: relatedUserIds },
    });

    const hasAccess =
      toObjectIdString(getAssignedUserId(client)) === toObjectIdString(currentUser._id) ||
      toObjectIdString(client.createdBy) === toObjectIdString(currentUser._id) ||
      managedSalesCount > 0;

    if (hasAccess) {
      return;
    }
  } else if (toObjectIdString(getAssignedUserId(client)) === toObjectIdString(currentUser._id)) {
    return;
  }

  throw new ApiError(403, "You do not have access to this resource");
};

const getAccessibleClient = async (clientId, currentUser) => {
  const client = await Client.findById(clientId);

  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  await assertClientAccess(client, currentUser);
  return client;
};

const assertProjectExists = async (projectId) => {
  if (!projectId) {
    return null;
  }

  const project = await Project.findById(projectId).select("_id projectName publicAlias");

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  return project;
};

const assertValidAssignee = async (assignedStaff, client, currentUser) => {
  const assigneeId = assignedStaff || getAssignedUserId(client) || currentUser._id;
  const user = await User.findOne({ _id: assigneeId, isActive: true }).select("_id role managerId");

  if (!user || user.role === "super-admin") {
    throw new ApiError(400, "Assigned staff is invalid");
  }

  if (currentUser.role === "sales" && toObjectIdString(user._id) !== toObjectIdString(currentUser._id)) {
    throw new ApiError(403, "Staff can only assign appointments to themselves");
  }

  if (currentUser.role === "manager") {
    const isSelf = toObjectIdString(user._id) === toObjectIdString(currentUser._id);
    const isManagedSales = user.role === "sales" && toObjectIdString(user.managerId) === toObjectIdString(currentUser._id);

    if (!isSelf && !isManagedSales) {
      throw new ApiError(403, "Managers can only assign appointments to their own team");
    }
  }

  return user._id;
};

const populateSiteVisitUsers = (query) =>
  query
    .populate("client", "ownerName clientPhoneNumber areaPreference premiseArea leadStatus interestLevel assignedStaff assignedTo nextFollowUpDate")
    .populate("project", "projectName publicAlias location configuration")
    .populate("assignedStaff", "name role")
    .populate("createdBy", "name role")
    .populate("updatedBy", "name role");

const normalizeSiteVisit = (siteVisit) => {
  const visit = typeof siteVisit.toObject === "function" ? siteVisit.toObject() : { ...siteVisit };

  return {
    ...visit,
    leadId: visit.client?._id || visit.client,
    projectId: visit.project?._id || visit.project,
  };
};

const buildSiteVisitFilters = async (query, currentUser) => {
  const filters = {};
  const clientVisibilityFilter = await buildClientVisibilityFilter(currentUser);

  if (query.leadId || query.client || query.clientId) {
    const clientId = query.leadId || query.client || query.clientId;
    await getAccessibleClient(clientId, currentUser);
    filters.client = clientId;
  } else if (Object.keys(clientVisibilityFilter).length) {
    const visibleClients = await Client.find(clientVisibilityFilter).select("_id");
    filters.client = { $in: visibleClients.map((client) => client._id) };
  }

  if (query.projectId || query.project) {
    filters.project = query.projectId || query.project;
  }

  if (query.visitStatus) {
    filters.visitStatus = query.visitStatus;
  }

  if (query.staff || query.assignedStaff) {
    filters.assignedStaff = query.staff || query.assignedStaff;
  }

  if (query.pickupRequired === "true" || query.pickupRequired === true) {
    filters.pickupRequired = true;
  }

  if (query.pickupRequired === "false" || query.pickupRequired === false) {
    filters.pickupRequired = false;
  }

  const dateFilter = {};

  if (query.today === "true") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    dateFilter.$gte = start;
    dateFilter.$lte = end;
  }

  if (query.dateFrom) {
    const start = new Date(query.dateFrom);
    start.setHours(0, 0, 0, 0);
    dateFilter.$gte = start;
  }

  if (query.dateTo) {
    const end = new Date(query.dateTo);
    end.setHours(23, 59, 59, 999);
    dateFilter.$lte = end;
  }

  if (Object.keys(dateFilter).length) {
    filters.visitDateTime = dateFilter;
  }

  return filters;
};

export const createSiteVisit = async (payload, userId, currentUser) => {
  const client = await getAccessibleClient(payload.client, currentUser);
  const hasOverdueReminder = await hasOverdueReminderForLead(client._id);

  if (shouldBlockReminderAction(currentUser.role, hasOverdueReminder)) {
    throw createReminderLockError();
  }

  if (hasOverdueReminder && currentUser.role === "super-admin") {
    await createActivityLog(
      buildReminderLockOverrideActivity({
        performedBy: currentUser._id,
        targetId: client._id,
        module: "site-visits",
        message: "Super Admin bypassed overdue reminder lock",
        metadata: {
          source: "appointment-create",
        },
      })
    );
  }

  await assertProjectExists(payload.project);

  const assignedStaff = await assertValidAssignee(payload.assignedStaff, client, currentUser);
  const siteVisit = await SiteVisit.create({
    ...payload,
    client: client._id,
    project: payload.project,
    assignedStaff,
    createdBy: userId,
    updatedBy: userId,
  });

  await recordSiteVisitActivity({
    lead: client,
    siteVisit,
    performedBy: userId,
    action: "created",
    newValues: {
      project: payload.project,
      visitDateTime: payload.visitDateTime,
      visitStatus: payload.visitStatus || "Booked",
      assignedStaff,
    },
  });

  return normalizeSiteVisit(await populateSiteVisitUsers(SiteVisit.findById(siteVisit._id)));
};

export const listSiteVisits = async (query = {}, currentUser) => {
  const { page, limit, skip } = buildPagination(query);
  const filters = await buildSiteVisitFilters(query, currentUser);

  const [items, total] = await Promise.all([
    populateSiteVisitUsers(SiteVisit.find(filters))
      .sort({ visitDateTime: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SiteVisit.countDocuments(filters),
  ]);

  return {
    items: items.map(normalizeSiteVisit),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getSiteVisitById = async (siteVisitId, currentUser) => {
  const siteVisit = await populateSiteVisitUsers(SiteVisit.findById(siteVisitId));

  if (!siteVisit) {
    throw new ApiError(404, "Appointment not found");
  }

  await getAccessibleClient(siteVisit.client?._id || siteVisit.client, currentUser);
  return normalizeSiteVisit(siteVisit);
};

export const updateSiteVisit = async (siteVisitId, payload, currentUser) => {
  const siteVisit = await SiteVisit.findById(siteVisitId);

  if (!siteVisit) {
    throw new ApiError(404, "Appointment not found");
  }

  const client = await getAccessibleClient(siteVisit.client, currentUser);
  const previousSiteVisit = siteVisit.toObject();
  const nextPayload = { ...payload };

  if (nextPayload.client && toObjectIdString(nextPayload.client) !== toObjectIdString(siteVisit.client)) {
    const nextClient = await getAccessibleClient(nextPayload.client, currentUser);
    siteVisit.client = nextClient._id;
  }

  if (nextPayload.project) {
    await assertProjectExists(nextPayload.project);
  }

  if (!siteVisit.assignedStaff || nextPayload.assignedStaff) {
    nextPayload.assignedStaff = await assertValidAssignee(nextPayload.assignedStaff, client, currentUser);
  }

  nextPayload.updatedBy = currentUser._id;
  siteVisit.set(nextPayload);
  await siteVisit.save();

  await recordSiteVisitActivity({
    lead: client,
    siteVisit,
    performedBy: currentUser._id,
    action: "updated",
    oldValues: {
      project: previousSiteVisit.project,
      visitDateTime: previousSiteVisit.visitDateTime,
      visitStatus: previousSiteVisit.visitStatus,
      assignedStaff: previousSiteVisit.assignedStaff,
    },
    newValues: {
      project: siteVisit.project,
      visitDateTime: siteVisit.visitDateTime,
      visitStatus: siteVisit.visitStatus,
      assignedStaff: siteVisit.assignedStaff,
    },
  });

  return normalizeSiteVisit(await populateSiteVisitUsers(SiteVisit.findById(siteVisit._id)));
};
