import mongoose from "mongoose";

const callLogSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    callConnected: { type: Boolean, default: false },
    leadStatus: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "New Lead",
        "Call Pending",
        "Connected",
        "Requirement Taken",
        "Details Sent",
        "Follow-up Pending",
        "Positive",
        "Site Visit Planned",
        "Negotiation",
        "Booking",
        "Closed",
        "Lost",
      ],
    },
    interestLevel: {
      type: String,
      trim: true,
      enum: ["Hot", "Warm", "Cold", ""],
      default: "",
    },
    discussionSummary: { type: String, required: true, trim: true, minlength: 3, maxlength: 2000 },
    requirementNote: { type: String, trim: true, maxlength: 1000, default: "" },
    objection: { type: String, trim: true, maxlength: 1000, default: "" },
    nextAction: { type: String, trim: true, maxlength: 200, default: "" },
    nextFollowupDateTime: { type: Date, default: null },
    reminderType: {
      type: String,
      trim: true,
      enum: ["None", "Call", "WhatsApp", "Details Send", "Site Visit", "Payment", "Document", ""],
      default: "",
    },
    callDuration: { type: Number, min: 0, default: null },
    lostReason: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
      required: function () {
        return this.leadStatus === "Lost";
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

callLogSchema.index({ client: 1, createdAt: -1 });

export const CallLog = mongoose.model("CallLog", callLogSchema);
