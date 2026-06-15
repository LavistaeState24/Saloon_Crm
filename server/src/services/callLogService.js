import { CallLog } from "../models/CallLog.js";
import { Client } from "../models/Client.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { buildReminderLockOverrideActivity, createReminderLockError, shouldBlockReminderAction } from "../utils/reminderLock.js";
import { createActivityLog, recordCallActivity, recordLeadChangeActivities } from "./activityLogService.js";
import { createFollowupFromCallLog } from "./followupService.js";
import { hasOverdueReminderForLead } from "./reminderService.js";

const toObjectId = (value) => value?._id || value || null;
const toObjectIdString = (value) => String(toObjectId(value) || "");

const getAssignedUserId = (client) => toObjectId(client.assignedStaff) || toObjectId(client.assignedTo) || null;

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

const populateCallLogUsers = (query) => query.populate("createdBy", "name role");

export const listCallLogs = async (clientId, currentUser) => {
  await getAccessibleClient(clientId, currentUser);

  return populateCallLogUsers(CallLog.find({ client: clientId }).sort({ createdAt: -1 }));
};

export const createCallLog = async (clientId, payload, currentUser) => {
  const client = await getAccessibleClient(clientId, currentUser);
  const previousClient = client.toObject();
  const hasOverdueReminder = await hasOverdueReminderForLead(client._id);
  const isTerminalLeadStatus = ["Lost", "Closed"].includes(payload.leadStatus);
  const normalizedPayload = {
    ...payload,
    nextFollowupDateTime: isTerminalLeadStatus ? null : payload.nextFollowupDateTime || null,
    reminderType: isTerminalLeadStatus ? "None" : payload.reminderType,
  };

  if (shouldBlockReminderAction(currentUser.role, hasOverdueReminder)) {
    throw createReminderLockError();
  }

  if (hasOverdueReminder && currentUser.role === "super-admin") {
    await createActivityLog(
      buildReminderLockOverrideActivity({
        performedBy: currentUser._id,
        targetId: client._id,
        metadata: {
          source: "call-log",
        },
      })
    );
  }

  const callLog = await CallLog.create({
    ...normalizedPayload,
    client: client._id,
    createdBy: currentUser._id,
  });

  const clientUpdates = {
    leadStatus: normalizedPayload.leadStatus,
    lastCallStatus: normalizedPayload.discussionSummary,
    nextFollowUpDate: normalizedPayload.nextFollowupDateTime,
  };

  if (normalizedPayload.interestLevel) {
    clientUpdates.interestLevel = normalizedPayload.interestLevel;
  }

  if (normalizedPayload.requirementNote) {
    clientUpdates.notes = [client.notes, normalizedPayload.requirementNote].filter(Boolean).join("\n\n");
  }

  client.set(clientUpdates);
  await client.save();

  await createFollowupFromCallLog({
    client: client._id,
    assignedStaff: getAssignedUserId(client) || currentUser._id,
    leadStatus: normalizedPayload.leadStatus,
    reminderType: normalizedPayload.reminderType,
    reminderDateTime: normalizedPayload.nextFollowupDateTime,
    note: normalizedPayload.nextAction || normalizedPayload.discussionSummary,
    createdBy: currentUser._id,
  });

  const refreshedClient = await Client.findById(client._id);

  await Promise.all([
    recordCallActivity({
      lead: refreshedClient,
      callLog,
      performedBy: currentUser._id,
      metadata: {
        callConnected: Boolean(payload.callConnected),
        reminderType: normalizedPayload.reminderType,
        lostReason: normalizedPayload.lostReason || "",
      },
    }),
    recordLeadChangeActivities({
      lead: refreshedClient,
      before: previousClient,
      after: refreshedClient,
      performedBy: currentUser._id,
      metadata: {
        source: "call-log",
      },
    }),
  ]);

  return populateCallLogUsers(CallLog.findById(callLog._id));
};
