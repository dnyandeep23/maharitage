import mongoose from "mongoose";

const VisitorStatsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "site",
    },
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.VisitorStats ||
  mongoose.model("VisitorStats", VisitorStatsSchema);
