import mongoose from 'mongoose';

const TempSiteSchema = new mongoose.Schema({
  site_id: { type: String, required: true, unique: true },
  site_name: { type: String, required: true },
  location: {
    latitude: Number,
    longitude: Number,
    district: String,
    state: String,
    country: String,
  },
  Site_discription: String,
  heritage_type: String,
  period: String,
  historical_context: {
    ruler_or_dynasty: String,
    approx_date: String,
    related_figures: [String],
    cultural_significance: String,
  },
  verification_authority: {
    curated_by: [String],
  },
  references: [
    {
      title: String,
      author: String,
      year: Number,
      url: String,
    },
  ],
  Gallary: [String],
  Inscriptions: [
    {
      Inscription_id: String,
      image_urls: [String],
      discription: String,
      original_script: String,
      language_detected: String,
      translations: {
        english: String,
        hindi: String,
      },
    },
  ],
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'rejected', 'needs_update'],
    default: 'pending',
  },
  researchExpertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
});

TempSiteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.TempSite || mongoose.model('TempSite', TempSiteSchema);
