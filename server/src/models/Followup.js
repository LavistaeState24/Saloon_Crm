import mongoose from "mongoose";

const followupSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    note: { type: String, required: true, trim: true, minlength: 3, maxlength: 500 },
    dueDate: { type: Date, required: true },
    reminderDateTime: { type: Date, required: true },
    type: {
      type: String,
      enum: ["call", "meeting", "site visit", "whatsapp", "email", "payment", "document", "details send"],
      default: "call",
    },
    reminderType: {
      type: String,
      required: true,
      trim: true,
      enum: ["Call", "WhatsApp", "Details Send", "Site Visit", "Payment", "Document"],
    },
    status: {
      type: String,
      required: true,
      trim: true,
      enum: ["Pending", "Completed", "Overdue", "Cancelled"],
      default: "Pending",
    },
    relatedModule: { type: String, enum: ["shareRecord"], default: undefined },
    relatedId: { type: mongoose.Schema.Types.ObjectId, default: undefined },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    completionNote: { type: String, trim: true, maxlength: 500, default: "" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

followupSchema.index({ assignedStaff: 1, reminderDateTime: 1, status: 1 });
followupSchema.index({ client: 1, reminderDateTime: -1 });

followupSchema.pre("validate", function normalizeLegacyFollowup(next) {
  if (!this.reminderDateTime && this.dueDate) {
    this.reminderDateTime = this.dueDate;
  }

  if (!this.dueDate && this.reminderDateTime) {
    this.dueDate = this.reminderDateTime;
  }

  if (!this.reminderType && this.type) {
    const legacyTypeMap = {
      call: "Call",
      whatsapp: "WhatsApp",
      email: "Details Send",
      "details send": "Details Send",
      "site visit": "Site Visit",
      meeting: "Site Visit",
      payment: "Payment",
      document: "Document",
    };
    this.reminderType = legacyTypeMap[this.type] || "Call";
  }

  if (!this.type && this.reminderType) {
    const reminderTypeMap = {
      Call: "call",
      WhatsApp: "whatsapp",
      "Details Send": "details send",
      "Site Visit": "site visit",
      Payment: "payment",
      Document: "document",
    };
    this.type = reminderTypeMap[this.reminderType] || "call";
  }

  if (!this.status) {
    this.status = this.completed ? "Completed" : "Pending";
  }

  next();
});

export const Followup = mongoose.model("Followup", followupSchema);
