import mongoose from "mongoose";

const sharedFieldsSchema = new mongoose.Schema(
  {
    branchArea: { type: String, trim: true, maxlength: 120 },
    duration: { type: String, trim: true, maxlength: 80 },
    sessionTime: { type: String, trim: true, maxlength: 80 },
    servicePrice: { type: String, trim: true, maxlength: 120 },
    availabilityDate: { type: String, trim: true, maxlength: 80 },
    includes: [{ type: String, trim: true, maxlength: 500 }],
    brochureUrl: { type: String, trim: true, maxlength: 500, default: null },
    sampleVideoUrl: { type: String, trim: true, maxlength: 500, default: null },
    photos: [{ type: String, trim: true, maxlength: 500 }],
  },
  { _id: false }
);

const sharedProjectSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    projectPublicAlias: { type: String, required: true, trim: true, maxlength: 100 },
    sharedFields: { type: sharedFieldsSchema, required: true },
  },
  { _id: false }
);

const shareRecordSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
      index: true,
    },
    clientName: { type: String, required: true, trim: true, minlength: 3, maxlength: 60 },
    clientPhone: { type: String, required: true, trim: true, match: /^[6-9]\d{9}$/ },
    clientEmail: { type: String, trim: true, lowercase: true, maxlength: 120, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    clientRequirement: { type: String, trim: true, maxlength: 200 },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: false,
      index: true,
    },
    projectIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },
    ],
    projectPublicAlias: { type: String, required: true, trim: true, maxlength: 100 },
    projectPublicAliases: [{ type: String, trim: true, maxlength: 100 }],
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sharedByName: { type: String, required: true, trim: true, maxlength: 60 },
    sharedByPhone: { type: String, required: true, trim: true, match: /^[6-9]\d{9}$/ },
    sharedFields: { type: sharedFieldsSchema, required: true },
    sharedProjects: [sharedProjectSchema],
    shareChannel: {
      type: String,
      enum: ["WhatsApp", "Copy"],
      default: "WhatsApp",
    },
    sharedMessage: { type: String, trim: true, maxlength: 4000, default: "" },
    whatsappMessage: { type: String, required: true, trim: true, maxlength: 4000 },
    sharedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["shared", "interested", "follow-up", "appointment", "closed", "not-interested"],
      default: "shared",
    },
    followUpDate: {
      type: Date,
      default: null,
    },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

shareRecordSchema.index({ clientPhone: 1, createdAt: -1 });
shareRecordSchema.index({ projectId: 1, createdAt: -1 });
shareRecordSchema.index({ client: 1, createdAt: -1 });

shareRecordSchema.pre("validate", function normalizeShareRecord(next) {
  if ((!this.projectIds || !this.projectIds.length) && this.projectId) {
    this.projectIds = [this.projectId];
  }

  if ((!this.projectPublicAliases || !this.projectPublicAliases.length) && this.projectPublicAlias) {
    this.projectPublicAliases = [this.projectPublicAlias];
  }

  if ((!this.sharedProjects || !this.sharedProjects.length) && this.projectId && this.projectPublicAlias && this.sharedFields) {
    this.sharedProjects = [
      {
        projectId: this.projectId,
        projectPublicAlias: this.projectPublicAlias,
        sharedFields: this.sharedFields,
      },
    ];
  }

  if (!this.sharedMessage && this.whatsappMessage) {
    this.sharedMessage = this.whatsappMessage;
  }

  if (!this.whatsappMessage && this.sharedMessage) {
    this.whatsappMessage = this.sharedMessage;
  }

  if (!this.sharedAt) {
    this.sharedAt = this.createdAt || new Date();
  }

  next();
});

export const ShareRecord = mongoose.model("ShareRecord", shareRecordSchema);
