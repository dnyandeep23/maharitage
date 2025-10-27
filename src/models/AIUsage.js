
import mongoose from 'mongoose';

const AIUsageSchema = new mongoose.Schema({
  fingerprint: {
    type: String,
    required: true,
    unique: true,
    null: false,
  },
  queryCount: {
    type: Number,
    default: 0,
  },
  firstQueryAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.AIUsage || mongoose.model('AIUsage', AIUsageSchema);
