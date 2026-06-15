import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    activityType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    oldValues: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValues: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    relatedModule: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    action: {
      type: String,
      trim: true,
      default: "",
    },

    module: {
      type: String,
      trim: true,
      default: "",
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },

  { timestamps: true }
);

activityLogSchema.index({ leadId: 1, createdAt: -1 });
activityLogSchema.index({ leadId: 1, activityType: 1, createdAt: -1 });

export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
