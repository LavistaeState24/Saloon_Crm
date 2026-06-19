import { Client } from "../models/Client.js";
import { Followup } from "../models/Followup.js";
import { Project } from "../models/Project.js";
import { ShareRecord } from "../models/ShareRecord.js";
import { ApiError } from "../utils/ApiError.js";
import { applyScopedFilter, assertDocumentScope, getModuleScope } from "../utils/accessControl.js";
import { recordShareActivity } from "./activityLogService.js";

const normalizePhoneDigits = (value) => String(value || "").replace(/\D/g, "").slice(-10);

const resolveSharedRecordClientId = async (shareRecord) => {
  if (shareRecord.client) {
    return shareRecord.client;
  }

  const candidatePhone = normalizePhoneDigits(shareRecord.clientPhone);
  if (!candidatePhone) {
    return null;
  }

  const client = await Client.findOne({
    clientPhoneNumber: candidatePhone,
  }).select("_id");

  return client?._id || null;
};

export const createShareRecord = async (payload, currentUser) => {
  const project = await Project.findById(payload.projectId);

  if (!project) {
    throw new ApiError(404, "Service not found");
  }

  assertDocumentScope(project, getModuleScope(currentUser, "projects"), currentUser, {
    assigned: ["createdBy"],
    own: ["createdBy"],
  });

  const shareRecord = await ShareRecord.create({
    ...payload,
    sharedBy: currentUser._id,
    sharedByName: currentUser.name,
    sharedByPhone: currentUser.phone,
  });

  await syncShareRecordFollowupReminder(
    shareRecord,
    currentUser
  );

  if (shareRecord.client) {
    await recordShareActivity({
      lead: shareRecord.client,
      shareRecord,
      performedBy: currentUser._id,
      metadata: {
        source: "share-record",
      },
    });
  }

  return shareRecord;
};

export const listShareRecords = async (currentUser) =>
  ShareRecord.find(
    applyScopedFilter({}, getModuleScope(currentUser, "shareRecords"), currentUser, {
      assigned: ["sharedBy"],
      own: ["sharedBy"],
    })
  )
    .populate("projectId", "publicAlias location status")
    .populate("sharedBy", "name phone role")
    .sort({ createdAt: -1 });

const syncShareRecordFollowupReminder = async (shareRecord, currentUser) => {
  const reminderQuery = {
    relatedModule: "shareRecord",
    relatedId: shareRecord._id,
  };

  // In that case, try to find the CRM customer by the shared customer phone number.
  let clientId = await resolveSharedRecordClientId(shareRecord);

  if (clientId && !shareRecord.client) {
    shareRecord.client = clientId;
    await ShareRecord.updateOne(
      { _id: shareRecord._id, client: { $ne: clientId } },
      { $set: { client: clientId } }
    );
  }

  // because Followup.client is required in the Followup model.
  if (!clientId) {
    return;
  }

  const reminderType = shareRecord.shareChannel === "Copy" ? "Details Send" : "WhatsApp";

 
  // cancel the linked reminder instead of leaving an old pending reminder active.
  if (!shareRecord.followUpDate) {
    await Followup.findOneAndUpdate(reminderQuery, {
      status: "Cancelled",
      completed: true,
      completedAt: new Date(),
      completedBy: currentUser._id,
    });

    return;
  }

  // relatedModule + relatedId prevents duplicate reminders.
  await Followup.findOneAndUpdate(
    reminderQuery,
    {
      client: clientId,
      leadId: clientId,
      project: shareRecord.projectId,
      assignedStaff: shareRecord.sharedBy,
      reminderType,
      note: "Follow up after shared service details",
      reminderDateTime: shareRecord.followUpDate,
      dueDate: shareRecord.followUpDate,
      status: "Pending",
      completed: false,
      completionNote: "",
      createdBy: currentUser._id,
      relatedModule: "shareRecord",
      relatedId: shareRecord._id,
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
};

export const getShareRecordsByClientPhone = async (clientPhone, currentUser) =>
  ShareRecord.find(
    applyScopedFilter({ clientPhone }, getModuleScope(currentUser, "shareRecords"), currentUser, {
      assigned: ["sharedBy"],
      own: ["sharedBy"],
    })
  )
    .populate("projectId", "publicAlias location status")
    .populate("sharedBy", "name phone role")
    .sort({ createdAt: -1 });

export const getShareRecordsByProjectId = async (projectId, currentUser) =>
  ShareRecord.find(
    applyScopedFilter({ projectId }, getModuleScope(currentUser, "shareRecords"), currentUser, {
      assigned: ["sharedBy"],
      own: ["sharedBy"],
    })
  )
    .populate("projectId", "publicAlias location status")
    .populate("sharedBy", "name phone role")
    .sort({ createdAt: -1 });

export const updateShareRecordStatus = async (id, payload, currentUser) => {
  const shareRecord = await ShareRecord.findById(id);

  if (!shareRecord) {
    throw new ApiError(404, "Share record not found");
  }

  assertDocumentScope(shareRecord, getModuleScope(currentUser, "shareRecords"), currentUser, {
    assigned: ["sharedBy"],
    own: ["sharedBy"],
  });

  const previousShareRecord = shareRecord.toObject();
  shareRecord.status = payload.status;
  shareRecord.followUpDate = payload.followUpDate ?? null;
  await shareRecord.save();
  await syncShareRecordFollowupReminder(shareRecord, currentUser);
  await shareRecord.populate("projectId", "publicAlias location status");
  await shareRecord.populate("sharedBy", "name phone role");

  if (shareRecord.client) {
    await recordShareActivity({
      lead: shareRecord.client,
      shareRecord,
      performedBy: currentUser._id,
      metadata: {
        source: "share-record-status",
        previousStatus: previousShareRecord.status,
      },
    });
  }

  return shareRecord;
};

export const updateShareRecordNotes = async (id, payload, currentUser) => {
  const shareRecord = await ShareRecord.findById(id);

  if (!shareRecord) {
    throw new ApiError(404, "Share record not found");
  }

  assertDocumentScope(shareRecord, getModuleScope(currentUser, "shareRecords"), currentUser, {
    assigned: ["sharedBy"],
    own: ["sharedBy"],
  });

  const previousShareRecord = shareRecord.toObject();
  shareRecord.notes = payload.notes;
  shareRecord.followUpDate = payload.followUpDate ?? null;
  await shareRecord.save();
  await syncShareRecordFollowupReminder(shareRecord, currentUser);
  await shareRecord.populate("projectId", "publicAlias location status");
  await shareRecord.populate("sharedBy", "name phone role");

  if (shareRecord.client) {
    await recordShareActivity({
      lead: shareRecord.client,
      shareRecord,
      performedBy: currentUser._id,
      metadata: {
        source: "share-record-notes",
        previousNotes: previousShareRecord.notes,
      },
    });
  }

  return shareRecord;
};

export const deleteShareRecord = async (id, currentUser) => {
  const shareRecord = await ShareRecord.findById(id);

  if (!shareRecord) {
    throw new ApiError(404, "Share record not found");
  }

  assertDocumentScope(shareRecord, getModuleScope(currentUser, "shareRecords"), currentUser, {
    assigned: ["sharedBy"],
    own: ["sharedBy"],
  });

  await shareRecord.deleteOne();

  return shareRecord;
};
