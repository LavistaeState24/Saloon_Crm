import mongoose from "mongoose";

const dealSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    finalProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    finalUnit: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    finalPrice: {
      type: Number,
      min: 0,
      default: null,
    },
    brokerageDetails: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    tokenAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    bookingDate: {
      type: Date,
      default: null,
    },
    paymentStatus: {
      type: String,
      trim: true,
      enum: ["Pending", "Token Paid", "Partially Paid", "Paid", "Refunded"],
      default: "Pending",
    },
    documentsPending: {
      type: Boolean,
      default: false,
    },
    dealClosedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    dealStatus: {
      type: String,
      trim: true,
      enum: ["Negotiation", "Booking", "Closed", "Cancelled"],
      default: "Negotiation",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
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

dealSchema.index({ leadId: 1, dealStatus: 1 });
dealSchema.index({ dealStatus: 1, bookingDate: -1, createdAt: -1 });

dealSchema.pre("validate", function validateClosedDeal(next) {
  if (this.dealStatus === "Closed") {
    if (this.finalPrice === null || this.finalPrice === undefined) {
      this.invalidate("finalPrice", "Final price is required when deal is Closed");
    }

    if (!this.brokerageDetails || !String(this.brokerageDetails).trim()) {
      this.invalidate("brokerageDetails", "Brokerage details are required when deal is Closed");
    }

    if (!this.bookingDate) {
      this.invalidate("bookingDate", "Booking date is required when deal is Closed");
    }

    if (!this.dealClosedBy) {
      this.invalidate("dealClosedBy", "Deal closed by is required when deal is Closed");
    }
  }

  next();
});

export const Deal = mongoose.model("Deal", dealSchema);
