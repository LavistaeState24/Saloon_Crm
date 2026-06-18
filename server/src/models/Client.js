import mongoose from "mongoose";

const customerSourceOptions = [
  "Walk-in",
  "Referral",
  "Instagram",
  "Facebook",
  "Google",
  "WhatsApp",
  "Phone",
  "Website",
];

const customerTypeOptions = ["Walk-in", "Regular", "VIP", "Bridal", "Corporate"];

const customerStatusOptions = [
  "New Customer",
  "Contacted",
  "Appointment Planned",
  "Service Completed",
  "Follow-up Pending",
  "Converted",
  "Lost",
];

const legacyLeadStatusOptions = [
  "New Lead",
  "Call Pending",
  "Connected",
  "Requirement Taken",
  "Details Sent",
  "Positive",
  "Site Visit Planned",
  "Negotiation",
  "Booking",
  "Closed",
];

const serviceInterestedOptions = [
  "",
  "Haircut",
  "Hair Color",
  "Facial",
  "Cleanup",
  "Spa",
  "Makeup",
  "Bridal Package",
  "Nail Art",
  "Grooming",
];

const clientSchema = new mongoose.Schema(
  {
    ownerName: { type: String, required: true, trim: true, minlength: 3, maxlength: 80 },
    address: { type: String, required: true, trim: true, minlength: 5, maxlength: 200 },
    premiseName: { type: String, trim: true, maxlength: 100 },
    premiseArea: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },

    sourceOfProperty: {
      type: String,
      required: true,
      trim: true,
      enum: customerSourceOptions,
    },

    propertyType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
      enum: customerTypeOptions,
    },

    ownerPrice: { type: Number, min: 0 },

    propertyCondition: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },

    propertyAge: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
    propertySize: { type: String, trim: true, maxlength: 80, default: "" },
    clientPhoneNumber: { type: String, required: true, trim: true, match: /^[6-9]\d{9}$/ },
    email: { type: String, trim: true, lowercase: true, maxlength: 120, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    internalNotes: { type: String, trim: true, maxlength: 500, default: "" },
    notes: { type: String, trim: true, maxlength: 2000, default: "" },

    propertyStatus: {
      type: String,
      required: true,
      trim: true,
      enum: customerStatusOptions,
      default: "New Customer",
    },

    dateOfAddingProperty: { type: Date, required: true },

    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    leadStatus: {
      type: String,
      required: true,
      trim: true,
      enum: [...customerStatusOptions, ...legacyLeadStatusOptions],
      default: "New Customer",
    },

    interestLevel: {
      type: String,
      required: true,
      trim: true,
      enum: ["Hot", "Warm", "Cold"],
      default: "Warm",
    },

    source: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    purpose: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },

    budgetMin: {
      type: Number,
      min: 0,
      default: null,
    },

    budgetMax: {
      type: Number,
      min: 0,
      default: null,
    },

    requirementType: {
      type: String,
      trim: true,
      maxlength: 80,
      enum: serviceInterestedOptions,
      default: "",
    },

    areaPreference: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },

    lastCallStatus: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },

    nextFollowUpDate: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Client = mongoose.model("Client", clientSchema);