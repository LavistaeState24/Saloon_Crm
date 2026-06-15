import crypto from "crypto";
import mongoose from "mongoose";

const shareLinkSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    sharedWithClientName: { type: String, trim: true, minlength: 3, maxlength: 60 },
    token: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(12).toString("hex"),
    },
    selectedFields: [{
      type: String,
      enum: [
        "publicAlias",
        "location",
        "propertyType",
        "configuration",
        "sizeRange",
        "priceRange",
        "possessionDate",
        "amenities",
        "brochure",
        "sampleHouseVideoUrl",
        "projectImages",
        "status",
      ],
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: Date,
  },
  { timestamps: true }
);

export const ShareLink = mongoose.model("ShareLink", shareLinkSchema);
