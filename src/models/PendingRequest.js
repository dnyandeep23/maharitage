import mongoose from 'mongoose';

const PendingRequestSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['site', 'inscription'],
  },
  action: {
    type: String,
    required: true,
    enum: ['add', 'modify'],
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  researchExpertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'rejected', 'needs_update'],
    default: 'pending',
  },
  adminFeedback: {
    type: String,
  },
}, { timestamps: true });

export default mongoose.models.PendingRequest || mongoose.model('PendingRequest', PendingRequestSchema);
