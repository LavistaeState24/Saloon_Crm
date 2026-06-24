import mongoose from "mongoose";

const appointmentStatusOptions = [
  "Pending",
  "Confirmed",
  "Checked In",
  "In Progress",
  "Completed",
  "Cancelled",
  "No Show",
  "Rescheduled",
];

const paymentStatusOptions = ["Unpaid", "Partial", "Paid", "Refunded"];

const salonAppointmentSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    serviceName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      index: true,
    },
    serviceCategory: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
      index: true,
    },
    appointmentDateTime: {
      type: Date,
      required: true,
      index: true,
    },
    durationMinutes: {
      type: Number,
      min: 0,
      default: 60,
    },
    appointmentStatus: {
      type: String,
      required: true,
      trim: true,
      enum: appointmentStatusOptions,
      default: "Pending",
      index: true,
    },
    paymentStatus: {
      type: String,
      required: true,
      trim: true,
      enum: paymentStatusOptions,
      default: "Unpaid",
      index: true,
    },
    serviceAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    depositAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    customerRequests: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    staffNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    followupNote: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    reminderAt: {
      type: Date,
      default: null,
      index: true,
    },
    source: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

salonAppointmentSchema.pre("validate", function validateCompletedAppointment(next) {
  if (this.appointmentStatus === "Completed") {
    if (!this.serviceName || this.serviceName.trim().length < 2) {
      this.invalidate("serviceName", "Service name is required for a completed appointment.");
    }

    if (!this.serviceAmount && this.serviceAmount !== 0) {
      this.invalidate("serviceAmount", "Service amount is required for a completed appointment.");
    }
  }

  next();
});

salonAppointmentSchema.index({ assignedStaff: 1, appointmentDateTime: 1, appointmentStatus: 1 });
salonAppointmentSchema.index({ client: 1, appointmentDateTime: -1 });
salonAppointmentSchema.index({ appointmentStatus: 1, reminderAt: 1 });

export const SalonAppointment = mongoose.model("SalonAppointment", salonAppointmentSchema);
