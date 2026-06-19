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
    // Service Name
    projectName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },

    // Display Name
    publicAlias: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
      unique: true,
    },

    // Branch
    location: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    // Branch Area
    area: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },

    // Service Category
    // Backend key kept same for Phase 4
    propertyType: {
      type: [
        {
          type: String,
          enum: [
            "Hair",
            "Skin",
            "Makeup",
            "Spa",
            "Nails",
            "Bridal",
            "Grooming",
            "Package",
          ],
        },
      ],
      default: [],
    },

    // Duration
    // Backend key kept same for Phase 4
    configuration: {
      type: String,
      required: true,
      trim: true,
      enum: ["15 min", "30 min", "45 min", "60 min", "90 min", "120 min"],
    },

    // Service Duration / Session Time
    sizeRange: {
      label: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50,
      },
      min: {
        type: Number,
        required: true,
        min: 1,
      },
      max: {
        type: Number,
        required: true,
        min: 1,
        validate: {
          validator(value) {
            return value >= this.sizeRange.min;
          },
          message: "Maximum session time must be greater than or equal to minimum session time",
        },
      },
      unit: {
        type: String,
        default: "min",
      },
    },

    // Service Price
    priceRange: {
      min: {
        type: Number,
        required: false,
        min: 1,
      },
      max: {
        type: Number,
        required: false,
        min: 1,
        validate: {
          validator(value) {
            if (
              value === undefined ||
              value === null ||
              this.priceRange?.min === undefined ||
              this.priceRange?.min === null
            ) {
              return true;
            }

            return value >= this.priceRange.min;
          },
          message: "Maximum price must be greater than or equal to minimum price",
        },
      },
      currencyLabel: {
        type: String,
        default: "INR",
      },
    },

    // Total Stock / Capacity
    totalPlotSize: {
      type: String,
      trim: true,
      maxlength: 50,
    },

    // Total Branches
    totalBlocks: {
      type: Number,
      required: true,
      min: 0,
    },

    // Total Slots
    totalUnits: {
      type: Number,
      required: true,
      min: 1,
    },

    // Available Slots
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
        message: "Available slots cannot exceed total slots",
      },
    },

    // Launch Date / Availability Date
    possessionDate: {
      type: Date,
      required: true,
    },

    // Includes
    amenities: [
      {
        type: String,
        trim: true,
        minlength: 1,
        maxlength: 600,
      },
    ],

    // Service Documents
    floorPlans: [assetSchema],

    // Service Brochure
    brochure: assetSchema,

    // Service Video
    hasSampleVideo: {
      type: Boolean,
      default: false,
    },

    sampleVideoUrl: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    // Service Images
    projectImages: [assetSchema],

    // Internal Notes
    internalNotes: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // Service Provider Details
    builderDetails: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    // Service Availability
    status: {
      type: String,
      enum: ["Available", "Not Available", "By Appointment Only"],
      default: "Available",
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