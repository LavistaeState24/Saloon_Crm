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
    pickupRequired: {
      type: Boolean,
      default: false,
    },
    visitStatus: {
      type: String,
      required: true,
      enum: ["Planned", "Done", "Cancelled", "Rescheduled"],
      default: "Planned",
    },
    postVisitResult: {
      type: String,
      enum: ["Interested", "Negotiation", "Not Interested", "Revisit Required", ""],
      default: "",
    },
    clientFeedback: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
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

siteVisitSchema.pre("validate", function validateDoneVisit(next) {
  if (this.visitStatus === "Done") {
    if (!this.clientFeedback || this.clientFeedback.trim().length < 3) {
      this.invalidate("clientFeedback", "Client feedback is required when visit is Done.");
    }

    if (!this.nextAction || this.nextAction.trim().length < 3) {
      this.invalidate("nextAction", "Next action is required when visit is Done.");
    }
  }

  next();
});

siteVisitSchema.index({ assignedStaff: 1, visitDateTime: 1, visitStatus: 1 });
siteVisitSchema.index({ client: 1, visitDateTime: -1 });
siteVisitSchema.index({ project: 1, visitDateTime: -1 });

export const SiteVisit = mongoose.model("SiteVisit", siteVisitSchema);