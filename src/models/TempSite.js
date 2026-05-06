import mongoose from "mongoose";

const TempSiteSchema = new mongoose.Schema(
  {
    site_id: { type: String, required: true },
    site_name: { type: String, required: true },
    heritage_type: { type: String, required: true },
    location: {
      latitude: Number,
      longitude: Number,
      district: String,
      state: String,
      country: String,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "approved", "rejected", "needs_update"],
      default: "pending",
    },
    researchExpertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    adminFeedback: {
      type: String,
    },
    action: {
      type: String,
      required: true,
      enum: ["add", "modify"],
    },
    type: {
      type: String,
      required: true,
      enum: ["site", "inscription"],
    },
    expiresAt: {
      type: Date,
      default: undefined,
    },
  },
  { strict: false }
);

TempSiteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.TempSite ||
  mongoose.model("TempSite", TempSiteSchema);
