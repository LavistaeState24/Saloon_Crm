import mongoose from "mongoose";

const siteVisitSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    visitDateTime: {
      type: Date,
      required: true,
    },
    // Staff Assigned / Assistance Required
    pickupRequired: {
      type: Boolean,
      default: false,
    },
    // Appointment Status
    visitStatus: {
      type: String,
      required: true,
      enum: ["Booked", "Confirmed", "Completed", "Cancelled", "No Show", "Rescheduled"],
      default: "Booked",
    },
    // Appointment Result
    postVisitResult: {
      type: String,
      enum: ["Service Completed", "Customer Interested", "Follow-up Required", "Rescheduled", "Cancelled", "No Show", ""],
      default: "",
    },
    // Customer Feedback
    clientFeedback: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    // Next Follow-up
    nextAction: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

siteVisitSchema.pre("validate", function validateCompletedAppointment(next) {
  if (this.visitStatus === "Completed") {
    if (!this.clientFeedback || this.clientFeedback.trim().length < 3) {
      this.invalidate("clientFeedback", "Customer feedback is required when appointment is completed.");
    }

    if (!this.nextAction || this.nextAction.trim().length < 3) {
      this.invalidate("nextAction", "Next follow-up is required when appointment is completed.");
    }
  }

  next();
});

siteVisitSchema.index({ assignedStaff: 1, visitDateTime: 1, visitStatus: 1 });
siteVisitSchema.index({ client: 1, visitDateTime: -1 });
siteVisitSchema.index({ project: 1, visitDateTime: -1 });

export const SiteVisit = mongoose.model("SiteVisit", siteVisitSchema);