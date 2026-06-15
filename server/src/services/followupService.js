import { Client } from "../models/Client.js";
import { SiteVisit } from "../models/SiteVisit.js";
import { Followup } from "../models/Followup.js";
import { Project } from "../models/Project.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { buildPagination } from "../utils/query.js";
import { recordFollowupActivity } from "./activityLogService.js";
import { hasOverdueReminderForLead } from "./reminderService.js";
import { shouldBlockReminderCreation } from "../utils/reminderLock.js";

const toObjectId = (value) => value?._id || value || null;
const toObjectIdString = (value) => String(toObjectId(value) || "");
const reminderTypeToLegacyType = {
  Call: "call",
  WhatsApp: "whatsapp",
  "Details Send": "details send",
  "Site Visit": "site visit",
  Payment: "payment",
  Document: "document",
};

const legacyTypeToReminderType = {
  call: "Call",
  whatsapp: "WhatsApp",
  email: "Details Send",
  "details send": "Details Send",
  "site visit": "Site Visit",
  meeting: "Site Visit",
  payment: "Payment",
  document: "Document",
};

const buildDateFieldFilter = (dateFilter) => ({
  $or: [
    { reminderDateTime: dateFilter },
    { reminderDateTime: { $exists: false }, dueDate: dateFilter },
  ],
});

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

const assertValidAssignee = async (assignedStaff, client, currentUser) => {
  const assigneeId = assignedStaff || getAssignedUserId(client) || currentUser._id;
  const user = await User.findOne({ _id: assigneeId, isActive: true }).select("_id role managerId");

  if (!user || user.role === "super-admin") {
    throw new ApiError(400, "Assigned staff is invalid");
  }

  if (currentUser.role === "sales" && toObjectIdString(user._id) !== toObjectIdString(currentUser._id)) {
    throw new ApiError(403, "Sales users can only assign reminders to themselves");
  }

  if (currentUser.role === "manager") {
    const isSelf = toObjectIdString(user._id) === toObjectIdString(currentUser._id);
    const isManagedSales = user.role === "sales" && toObjectIdString(user.managerId) === toObjectIdString(currentUser._id);

    if (!isSelf && !isManagedSales) {
      throw new ApiError(403, "Managers can only assign reminders to their own team");
    }
  }

  return user._id;
};

const getAccessibleClient = async (clientId, currentUser) => {
  const client = await Client.findById(clientId);

  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  await assertClientAccess(client, currentUser);
  return client;
};

const populateReminderUsers = (query) =>
  query
    .populate("client", "ownerName clientPhoneNumber areaPreference premiseArea leadStatus assignedStaff assignedTo")
    .populate("assignedStaff", "name role")
    .populate("createdBy", "name role")
    .populate("completedBy", "name role")
    .populate("project", "projectName publicAlias");

const normalizeReminder = (followup) => {
  const reminder = typeof followup.toObject === "function" ? followup.toObject() : { ...followup };
  const reminderDateTime = reminder.reminderDateTime || reminder.dueDate;
  const reminderType = reminder.reminderType || legacyTypeToReminderType[reminder.type] || "Call";
  const isOverdue = reminder.status === "Pending" && reminderDateTime && new Date(reminderDateTime) < new Date();

  return {
    ...reminder,
    leadId: reminder.client?._id || reminder.client,
    reminderDateTime,
    dueDate: reminderDateTime,
    reminderType,
    type: reminder.type || reminderTypeToLegacyType[reminderType],
    status: isOverdue ? "Overdue" : reminder.status || (reminder.completed ? "Completed" : "Pending"),
    completed: reminder.completed || reminder.status === "Completed",
  };
};

const buildReminderFilters = async (query, currentUser) => {
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

  if (query.status) {
    filters.status = query.status === "Overdue" ? "Pending" : query.status;
  }

  if (query.type || query.reminderType) {
    filters.reminderType = query.type || query.reminderType;
  }

  if (query.staff || query.assignedStaff) {
    filters.assignedStaff = query.staff || query.assignedStaff;
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
    dateFilter.$gte = new Date(query.dateFrom);
  }

  if (query.dateTo) {
    const end = new Date(query.dateTo);
    end.setHours(23, 59, 59, 999);
    dateFilter.$lte = end;
  }

  if (query.overdue === "true" || query.status === "Overdue") {
    filters.status = "Pending";
    dateFilter.$lt = new Date();
  }

  if (Object.keys(dateFilter).length) {
    Object.assign(filters, buildDateFieldFilter(dateFilter));
  }

  return filters;
};

export const createFollowup = async (payload, userId, currentUser) => {
  const client = await getAccessibleClient(payload.client, currentUser);
  const hasOverdueReminder = await hasOverdueReminderForLead(client._id);

  if (shouldBlockReminderCreation(currentUser.role, hasOverdueReminder)) {
    throw new ApiError(403, "Complete overdue reminder before creating a new reminder");
  }

  if (payload.project) {
    const project = await Project.findById(payload.project);

    if (!project) {
      throw new ApiError(404, "Project not found");
    }
  }

  const assignedStaff = await assertValidAssignee(payload.assignedStaff, client, currentUser);
  const reminderType = payload.reminderType || legacyTypeToReminderType[payload.type] || "Call";
  const reminderDateTime = payload.reminderDateTime || payload.dueDate;

  const followup = await Followup.create({
    ...payload,
    assignedStaff,
    reminderType,
    reminderDateTime,
    dueDate: reminderDateTime,
    type: payload.type || reminderTypeToLegacyType[reminderType],
    status: payload.status || "Pending",
    completed: payload.status === "Completed" || Boolean(payload.completed),
    createdBy: userId,
  });

  await recordFollowupActivity({
    action: "created",
    followup,
    performedBy: userId,
    metadata: {
      description: `Follow-up scheduled for ${followup.reminderType}.`,
    },
    newValues: {
      reminderType: followup.reminderType,
      reminderDateTime: followup.reminderDateTime,
      assignedStaff: followup.assignedStaff,
      status: followup.status,
    },
  });

  return normalizeReminder(await populateReminderUsers(Followup.findById(followup._id)));
};

export const listFollowups = async (query = {}, currentUser) => {
  const { page, limit, skip } = buildPagination(query);
  const filters = await buildReminderFilters(query, currentUser);

  const [items, total] = await Promise.all([
    populateReminderUsers(Followup.find(filters))
      .sort({ reminderDateTime: 1, dueDate: 1 })
      .skip(skip)
      .limit(limit),
    Followup.countDocuments(filters),
  ]);

  return {
    items: items.map(normalizeReminder),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getFollowupCounts = async (currentUser) => {
  const baseFilters = await buildReminderFilters({}, currentUser);
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const [today, overdue] = await Promise.all([
    Followup.countDocuments({
      $and: [
        baseFilters,
        { status: "Pending" },
        buildDateFieldFilter({ $gte: start, $lte: end }),
      ],
    }),
    Followup.countDocuments({
      $and: [
        baseFilters,
        { status: "Pending" },
        buildDateFieldFilter({ $lt: new Date() }),
      ],
    }),
  ]);

  return { today, overdue };
};

export const updateFollowup = async (followupId, payload, currentUser) => {
  const followup = await Followup.findById(followupId);

  if (!followup) {
    throw new ApiError(404, "Reminder not found");
  }

  const client = await getAccessibleClient(followup.client, currentUser);
  const previousFollowup = followup.toObject();
  const nextPayload = { ...payload };

  if (!followup.assignedStaff) {
    nextPayload.assignedStaff = await assertValidAssignee(nextPayload.assignedStaff, client, currentUser);
  }

  if (nextPayload.assignedStaff) {
    nextPayload.assignedStaff = await assertValidAssignee(nextPayload.assignedStaff, client, currentUser);
  }

  if (nextPayload.reminderType) {
    nextPayload.type = reminderTypeToLegacyType[nextPayload.reminderType];
  }

  if (nextPayload.reminderDateTime) {
    nextPayload.dueDate = nextPayload.reminderDateTime;
  }

  followup.set(nextPayload);
  await followup.save();

  await recordFollowupActivity({
    action: "updated",
    followup,
    performedBy: currentUser._id,
    oldValues: {
      reminderType: previousFollowup.reminderType,
      reminderDateTime: previousFollowup.reminderDateTime,
      assignedStaff: previousFollowup.assignedStaff,
      note: previousFollowup.note,
    },
    newValues: {
      reminderType: followup.reminderType,
      reminderDateTime: followup.reminderDateTime,
      assignedStaff: followup.assignedStaff,
      note: followup.note,
    },
  });

  return normalizeReminder(await populateReminderUsers(Followup.findById(followup._id)));
};

export const completeFollowup = async (followupId, payload, currentUser) => {
  const followup = await Followup.findById(followupId);

  if (!followup) {
    throw new ApiError(404, "Reminder not found");
  }

  const client = await getAccessibleClient(followup.client, currentUser);
  const previousFollowup = followup.toObject();

  if (followup.status === "Completed" || followup.completed) {
    throw new ApiError(400, "Completed reminder cannot be completed again", null, {
      status: "Completed reminder cannot be completed again",
    });
  }

  followup.set({
    assignedStaff: followup.assignedStaff || (await assertValidAssignee(null, client, currentUser)),
    status: "Completed",
    completed: true,
    completedAt: new Date(),
    completedBy: currentUser._id,
    completionNote: payload.completionNote,
  });
  await followup.save();

  await recordFollowupActivity({
    action: "completed",
    followup,
    performedBy: currentUser._id,
    oldValues: {
      status: previousFollowup.status,
      completed: previousFollowup.completed,
    },
    newValues: {
      status: followup.status,
      completed: followup.completed,
      completedAt: followup.completedAt,
      completedBy: followup.completedBy,
    },
  });

  return normalizeReminder(await populateReminderUsers(Followup.findById(followup._id)));
};

export const cancelFollowup = async (followupId, currentUser) => {
  const followup = await Followup.findById(followupId);

  if (!followup) {
    throw new ApiError(404, "Reminder not found");
  }

  const client = await getAccessibleClient(followup.client, currentUser);
  const previousFollowup = followup.toObject();

  if (followup.status === "Completed" || followup.completed) {
    throw new ApiError(400, "Completed reminder cannot be cancelled");
  }

  followup.set({ assignedStaff: followup.assignedStaff || (await assertValidAssignee(null, client, currentUser)), status: "Cancelled" });
  await followup.save();

  await recordFollowupActivity({
    action: "cancelled",
    followup,
    performedBy: currentUser._id,
    oldValues: { status: previousFollowup.status },
    newValues: { status: followup.status },
  });

  return normalizeReminder(await populateReminderUsers(Followup.findById(followup._id)));
};

export const hasOverduePendingFollowup = async (clientId) =>
  Boolean(
    await Followup.exists({
      client: clientId,
      status: "Pending",
      ...buildDateFieldFilter({ $lt: new Date() }),
    })
  );

export const createFollowupFromCallLog = async ({ client, assignedStaff, leadStatus, reminderType, reminderDateTime, note, createdBy }) => {
  if (["Lost", "Closed"].includes(leadStatus)) {
    return null;
  }

  if (!reminderDateTime || !reminderType || reminderType === "None") {
    return null;
  }

  const followup = await Followup.create({
    client,
    assignedStaff,
    reminderType,
    reminderDateTime,
    note: String(note || "Follow up").slice(0, 500),
    dueDate: reminderDateTime,
    type: reminderTypeToLegacyType[reminderType] || "call",
    status: "Pending",
    completed: false,
    createdBy,
  });

  await recordFollowupActivity({
    action: "created",
    followup,
    performedBy: createdBy,
    metadata: {
      source: "call-log",
      description: `Follow-up created from call log for ${reminderType}.`,
    },
    newValues: {
      reminderType,
      reminderDateTime,
      assignedStaff,
      status: "Pending",
    },
  });

  return followup;
};

export const getPendingWorkSummary = async (currentUser) => {
  const userId = currentUser._id;

  const pendingFollowups = await Followup.countDocuments({
    assignedStaff: userId,
    status: { $in: ["Pending", "Overdue"] },
  });

  const pendingSiteVisits = await SiteVisit.countDocuments({
    assignedStaff: userId,
    visitStatus: { $in: ["Planned", "Rescheduled"] },
  });

  return {
    pendingFollowups,
    pendingSiteVisits,
    total: pendingFollowups + pendingSiteVisits,
  };
};
