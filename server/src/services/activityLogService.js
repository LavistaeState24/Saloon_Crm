import { ActivityLog } from "../models/ActivityLog.js";
import { CallLog } from "../models/CallLog.js";
import { Client } from "../models/Client.js";
import { Deal } from "../models/Deal.js";
import { Followup } from "../models/Followup.js";
import { ShareRecord } from "../models/ShareRecord.js";
import { SiteVisit } from "../models/SiteVisit.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { buildPagination } from "../utils/query.js";

const toObjectId = (value) => value?._id || value || null;
const toObjectIdString = (value) => String(toObjectId(value) || "");

const getAssignedUserId = (client) => toObjectId(client?.assignedStaff) || toObjectId(client?.assignedTo) || null;

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

const normalizeText = (value) => String(value ?? "").trim();
const activityCategoryMap = {
  lead: ["lead.created", "lead.assigned", "lead.reassigned", "lead.status_changed", "lead.notes_updated", "lead.internal_notes_updated"],
  calls: ["call.logged"],
  followups: ["followup.created", "followup.updated", "followup.completed", "followup.cancelled"],
  shares: ["share.created"],
  visits: ["site_visit.created", "site_visit.updated"],
  deals: ["deal.created", "deal.updated", "deal.status_changed"],
};

const resolveUserSummary = async (value) => {
  const userId = toObjectId(value);

  if (!userId) {
    return null;
  }

  if (typeof value === "object" && value.name) {
    return {
      _id: value._id || userId,
      name: value.name,
      role: value.role || "",
    };
  }

  const user = await User.findById(userId).select("_id name role");
  return user ? { _id: user._id, name: user.name, role: user.role } : { _id: userId, name: String(userId), role: "" };
};

const safeCreateActivity = async (payload) => {
  try {
    return await ActivityLog.create(payload);
  } catch (error) {
    console.error("Failed to record activity log", error);
    return null;
  }
};

const buildChangeDescription = (label, oldValue, newValue) =>
  `${label} changed from ${normalizeText(oldValue) || "-"} to ${normalizeText(newValue) || "-"}`;

const collectRelatedDocs = async (activities) => {
  const moduleIds = new Map();

  activities.forEach((activity) => {
    const moduleName = activity.relatedModule;
    const relatedId = toObjectId(activity.relatedId);

    if (!moduleName || !relatedId) {
      return;
    }

    if (!moduleIds.has(moduleName)) {
      moduleIds.set(moduleName, new Set());
    }

    moduleIds.get(moduleName).add(String(relatedId));
  });

  const relatedDocs = new Map();

  const loadDocs = async (moduleName, model, populate = []) => {
    const ids = moduleIds.get(moduleName);

    if (!ids?.size) {
      return;
    }

    let query = model.find({ _id: { $in: [...ids] } });

    populate.forEach((path) => {
      query = query.populate(path);
    });

    const docs = await query;
    docs.forEach((doc) => {
      relatedDocs.set(`${moduleName}:${String(doc._id)}`, typeof doc.toObject === "function" ? doc.toObject() : doc);
    });
  };

  await Promise.all([
    loadDocs("callLogs", CallLog, ["createdBy"]),
    loadDocs("followups", Followup, ["client", "assignedStaff", "createdBy", "completedBy", "project"]),
    loadDocs("shareRecords", ShareRecord, ["client", "sharedBy", "projectId"]),
    loadDocs("siteVisits", SiteVisit, ["client", "project", "assignedStaff", "createdBy", "updatedBy"]),
    loadDocs("deals", Deal, ["leadId", "finalProject", "dealClosedBy", "createdBy", "updatedBy"]),
  ]);

  return relatedDocs;
};

const populateTimelineItems = async (activities) => {
  const relatedDocs = await collectRelatedDocs(activities);

  return activities.map((activity) => {
    const record = typeof activity.toObject === "function" ? activity.toObject() : { ...activity };
    const key = `${record.relatedModule}:${String(toObjectId(record.relatedId) || "")}`;

    return {
      ...record,
      relatedEntity: relatedDocs.get(key) || null,
    };
  });
};

export const recordActivity = async (payload) => {
  if (!payload?.leadId || !payload?.performedBy || !payload?.activityType || !payload?.title) {
    return null;
  }

  return safeCreateActivity({
    ...payload,
    relatedModule: payload.relatedModule || "",
    metadata: payload.metadata || {},
  });
};

export const recordLeadCreatedActivity = async ({ lead, performedBy, metadata = {} }) =>
  recordActivity({
    leadId: lead._id || lead,
    activityType: "lead.created",
    title: "Lead created",
    description: `Lead was created${metadata.assignedToName ? ` and assigned to ${metadata.assignedToName}` : ""}.`,
    newValues: {
      ownerName: lead.ownerName,
      assignedStaff: lead.assignedStaff || null,
      leadStatus: lead.leadStatus || "New Lead",
    },
    performedBy,
    relatedModule: "clients",
    relatedId: lead._id || lead,
    metadata,
  });

export const recordLeadChangeActivities = async ({ lead, before = {}, after = {}, performedBy, metadata = {} }) => {
  const activities = [];
  const oldAssignee = getAssignedUserId(before) || null;
  const newAssignee = getAssignedUserId(after) || null;
  const oldStatus = normalizeText(before.leadStatus);
  const newStatus = normalizeText(after.leadStatus);
  const oldNotes = normalizeText(before.notes);
  const newNotes = normalizeText(after.notes);
  const oldInternalNotes = normalizeText(before.internalNotes);
  const newInternalNotes = normalizeText(after.internalNotes);

  if (toObjectIdString(oldAssignee) !== toObjectIdString(newAssignee)) {
    const [oldUser, newUser] = await Promise.all([resolveUserSummary(oldAssignee), resolveUserSummary(newAssignee)]);
    activities.push({
      leadId: lead._id || lead,
      activityType: oldAssignee ? "lead.reassigned" : "lead.assigned",
      title: oldAssignee ? "Lead reassigned" : "Lead assigned",
      description: buildChangeDescription("Assigned staff", oldUser?.name || "-", newUser?.name || "-"),
      oldValues: { assignedStaff: oldUser },
      newValues: { assignedStaff: newUser },
      performedBy,
      relatedModule: "clients",
      relatedId: lead._id || lead,
      metadata,
    });
  }

  if (oldStatus !== newStatus) {
    activities.push({
      leadId: lead._id || lead,
      activityType: "lead.status_changed",
      title: "Lead status changed",
      description: buildChangeDescription("Lead status", oldStatus, newStatus),
      oldValues: { leadStatus: oldStatus },
      newValues: { leadStatus: newStatus },
      performedBy,
      relatedModule: "clients",
      relatedId: lead._id || lead,
      metadata,
    });
  }

  if (oldNotes !== newNotes) {
    activities.push({
      leadId: lead._id || lead,
      activityType: "lead.notes_updated",
      title: "Lead notes updated",
      description: "Lead notes were updated.",
      oldValues: { notes: oldNotes },
      newValues: { notes: newNotes },
      performedBy,
      relatedModule: "clients",
      relatedId: lead._id || lead,
      metadata,
    });
  }

  if (oldInternalNotes !== newInternalNotes) {
    activities.push({
      leadId: lead._id || lead,
      activityType: "lead.internal_notes_updated",
      title: "Internal notes updated",
      description: "Internal notes were updated.",
      oldValues: { internalNotes: oldInternalNotes },
      newValues: { internalNotes: newInternalNotes },
      performedBy,
      relatedModule: "clients",
      relatedId: lead._id || lead,
      metadata,
    });
  }

  if (!activities.length) {
    return null;
  }

  return Promise.all(activities.map((activity) => safeCreateActivity(activity)));
};

export const recordCallActivity = async ({ lead, callLog, performedBy, metadata = {} }) =>
  recordActivity({
    leadId: lead._id || lead,
    activityType: "call.logged",
    title: "Call logged",
    description: normalizeText(callLog.discussionSummary) || "A call update was saved.",
    newValues: {
      callConnected: Boolean(callLog.callConnected),
      leadStatus: callLog.leadStatus || lead.leadStatus || "",
      nextFollowupDateTime: callLog.nextFollowupDateTime || null,
      interestLevel: callLog.interestLevel || "",
      lostReason: callLog.lostReason || "",
    },
    performedBy,
    relatedModule: "callLogs",
    relatedId: callLog._id || callLog,
    metadata,
  });

export const recordFollowupActivity = async ({ action, followup, performedBy, metadata = {}, oldValues = null, newValues = null }) => {
  const activityTypeMap = {
    created: "followup.created",
    updated: "followup.updated",
    completed: "followup.completed",
    cancelled: "followup.cancelled",
  };

  const titleMap = {
    created: "Follow-up created",
    updated: "Follow-up updated",
    completed: "Follow-up completed",
    cancelled: "Follow-up cancelled",
  };

  return recordActivity({
    leadId: followup.client?._id || followup.client,
    activityType: activityTypeMap[action] || "followup.updated",
    title: titleMap[action] || "Follow-up updated",
    description: metadata.description || titleMap[action] || "Follow-up updated",
    oldValues,
    newValues,
    performedBy,
    relatedModule: "followups",
    relatedId: followup._id || followup,
    metadata,
  });
};

export const recordShareActivity = async ({ lead, shareRecord, performedBy, metadata = {} }) =>
  recordActivity({
    leadId: lead._id || lead,
    activityType: "share.created",
    title: "Property shared",
    description: `Shared ${shareRecord.projectPublicAliases?.length || 1} project(s) with the client.`,
    newValues: {
      projectIds: shareRecord.projectIds || [],
      shareChannel: shareRecord.shareChannel || "",
      status: shareRecord.status || "",
    },
    performedBy,
    relatedModule: "shareRecords",
    relatedId: shareRecord._id || shareRecord,
    metadata,
  });

export const recordSiteVisitActivity = async ({ lead, siteVisit, performedBy, action = "created", oldValues = null, newValues = null, metadata = {} }) =>
  recordActivity({
    leadId: lead._id || lead,
    activityType: action === "updated" ? "site_visit.updated" : "site_visit.created",
    title: action === "updated" ? "Site visit updated" : "Site visit created",
    description: action === "updated" ? "Site visit details were updated." : "Site visit was scheduled.",
    oldValues,
    newValues,
    performedBy,
    relatedModule: "siteVisits",
    relatedId: siteVisit._id || siteVisit,
    metadata,
  });

export const recordDealActivity = async ({ lead, deal, performedBy, action = "created", oldValues = null, newValues = null, metadata = {} }) =>
  recordActivity({
    leadId: lead._id || lead,
    activityType: action === "created" ? "deal.created" : action === "status_changed" ? "deal.status_changed" : "deal.updated",
    title:
      action === "created"
        ? "Deal created"
        : action === "status_changed"
          ? "Deal status changed"
          : "Deal updated",
    description:
      action === "created"
        ? `Deal created in ${deal.dealStatus || "Negotiation"} status.`
        : action === "status_changed"
          ? metadata.description || "Deal status was updated."
          : "Deal details were updated.",
    oldValues,
    newValues,
    performedBy,
    relatedModule: "deals",
    relatedId: deal._id || deal,
    metadata,
});

export const getClientActivityTimeline = async (clientId, query = {}, currentUser) => {
  const client = await getAccessibleClient(clientId, currentUser);
  const { page, limit, skip } = buildPagination(query);
  const filters = { leadId: client._id };

  if (query.activityType) {
    filters.activityType = query.activityType;
  }

  if (query.category && query.category !== "all") {
    const categoryTypes = activityCategoryMap[query.category];

    if (categoryTypes?.length) {
      filters.activityType = { $in: categoryTypes };
    }
  }

  if (query.relatedModule) {
    filters.relatedModule = query.relatedModule;
  }

  if (query.performedBy) {
    filters.performedBy = query.performedBy;
  }

  if (query.search) {
    const pattern = new RegExp(String(query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filters.$or = [{ title: pattern }, { description: pattern }];
  }

  const dateFilter = {};

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
    filters.createdAt = dateFilter;
  }

  const [items, total] = await Promise.all([
    ActivityLog.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("performedBy", "name role managerId")
      .populate("leadId", "ownerName clientPhoneNumber leadStatus assignedStaff assignedTo createdBy"),
    ActivityLog.countDocuments(filters),
  ]);

  const data = await populateTimelineItems(items);

  return {
    items: data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    lead: client,
  };
};
export const createActivityLog = async ({
  action,
  module,
  performedBy,
  targetId,
  message,
  leadId,
  metadata = {},
  oldValues = null,
  newValues = null,
}) => {
  return await ActivityLog.create({
    leadId: leadId || targetId,
    activityType: action,
    title: message || action,
    description: message || "",
    oldValues,
    newValues,
    performedBy,
    relatedModule: module || "",
    relatedId: targetId || leadId || null,
    metadata,
  });
};
