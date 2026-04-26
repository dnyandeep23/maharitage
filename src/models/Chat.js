import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  title: {
    type: String,
    default: 'New Chat',
  },
  mode: {
    type: String,
    enum: ['chat', 'quiz'],
    default: 'chat',
  },
  audienceType: {
    type: String,
    enum: ['general', 'student'],
    default: 'general',
  },
  score: {
    type: Number,
    default: 0,
  },
  progress: {
    type: Number,
    default: 0,
  },
  messages: [
    {
      sender: {
        type: String,
        enum: ['user', 'ai'],
        required: true,
      },
      message: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d',
  },
});

export default mongoose.models.Chat || mongoose.model('Chat', chatSchema);