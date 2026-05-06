import mongoose from 'mongoose';

const SiteSchema = new mongoose.Schema(
  {
    site_id: { type: String, required: true, unique: true },
    site_name: { type: String, required: true },
    heritage_type: { type: String, required: true },
    location: {
      latitude: Number,
      longitude: Number,
      district: String,
      state: String,
      country: String,
    },
  },
  { strict: false }
);

export default mongoose.models.Site || mongoose.model('Site', SiteSchema);
