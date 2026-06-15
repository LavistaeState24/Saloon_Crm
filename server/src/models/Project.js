import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 120 },
    url: { type: String, trim: true, maxlength: 300 },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    projectName: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
    publicAlias: { type: String, required: true, trim: true, minlength: 3, maxlength: 100, unique: true },
    location: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    area: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    propertyType: {
      type: [{ type: String, enum: ["1BHK", "2BHK", "2.5BHK", "3BHK", "4BHK", "5BHK", "6BHK","Villa","Plot", "Commercial",] }],
      default: [],
    },
    configuration: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    sizeRange: {
      label: { type: String, required: true, trim: true, maxlength: 50 },
      min: { type: Number, required: true, min: 1 },
      max: {
        type: Number,
        required: true,
        min: 1,
        validate: {
          validator(value) {
            return value >= this.sizeRange.min;
          },
          message: "Maximum size must be greater than or equal to minimum size",
        },
      },
      unit: { type: String, default: "sqft" },
    },
    priceRange: {
      min: { type: Number, required: false, min: 1 },
      max: {
        type: Number,
        required: false,
        min: 1,
        validate: {
          validator(value) {
            if (value === undefined || value === null || this.priceRange?.min === undefined || this.priceRange?.min === null) {
              return true;
            }
            return value >= this.priceRange.min;
          },
          message: "Maximum price must be greater than or equal to minimum price",
        },
      },
      currencyLabel: { type: String, default: "INR" },
    },
    totalPlotSize: { type: String, trim: true, maxlength: 50 },
    totalBlocks: { type: Number, required: true, min: 0 },
    totalUnits: { type: Number, required: true, min: 1 },
    availableUnits: {
      type: Number,
      required: false,
      min: 0,
      validate: {
        validator(value) {
          if (value === undefined || value === null) {
            return true;
          }

          return value <= this.totalUnits;
        },
        message: "Available units cannot exceed total units",
      },
    },
    possessionDate: { type: Date, required: true },
    amenities: [{ type: String, trim: true, minlength: 1, maxlength: 600 }],
    floorPlans: [assetSchema],
    brochure: assetSchema,
    hasSampleVideo: { type: Boolean, default: false },
    sampleVideoUrl: { type: String, trim: true, maxlength: 300, default: null },
    projectImages: [assetSchema],
    internalNotes: { type: String, trim: true, maxlength: 500 },
    builderDetails: { type: String, trim: true, maxlength: 300 },
    status: {
      type: String,
      enum: ["active", "sold out", "upcoming"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Project = mongoose.model("Project", projectSchema);
