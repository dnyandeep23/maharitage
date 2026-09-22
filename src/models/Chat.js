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
  quizState: {
    topic: {
      type: String,
      default: "",
    },
    difficulty: {
      type: String,
      default: "Medium",
    },
    questionCount: {
      type: Number,
      default: 5,
    },
    questionType: {
      type: String,
      default: "MCQ",
    },
    questions: {
      type: Array,
      default: [],
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    currentIndex: {
      type: Number,
      default: 0,
    },
    answeredQuestions: {
      type: Array,
      default: [],
    },
    selectedAnswers: {
      type: Object,
      default: {},
    },
    score: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    xp: {
      type: Number,
      default: 0,
    },
    isComplete: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"],
      default: "NOT_STARTED",
    },
    completedAt: {
      type: Date,
      default: null,
    },
    config: {
      type: Object,
      default: {},
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d',
  },
});

export default mongoose.models.Chat || mongoose.model('Chat', chatSchema);
