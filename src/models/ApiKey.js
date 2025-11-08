import mongoose from 'mongoose';

const ApiKeySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  usage: {
    type: Number,
    default: 0,
  },
  lastUsed: {
    type: Date,
  },
}, { timestamps: true });

export default mongoose.models.ApiKey || mongoose.model('ApiKey', ApiKeySchema);
