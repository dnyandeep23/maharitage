import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please provide a username"],
    unique: true,
    trim: true,
    minlength: [3, "Username must be at least 3 characters long"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: [8, "Password must be at least 8 characters long"],
    select: false,
  },
  role: {
    type: String,
    enum: {
      values: ["public-user", "research-expert", "admin"],
      message:
        "{VALUE} is not a valid role. Must be one of: public-user, research-expert, admin",
    },
    default: "public-user",
    required: [true, "Please specify a role"],
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,
  verificationTokenExpiry: Date,
  resetPasswordToken: String,
  resetPasswordExpiry: Date,
  lastLogin: Date,
  status: {
    type: String,
    enum: ["active", "inactive", "suspended"],
    default: "active",
  },
  profile: {
    avatar: String,
    bio: String,
    phone: String,
    address: String,
    preferences: {
      language: {
        type: String,
        default: "en",
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
      },
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Error comparing passwords");
  }
};

// Update the updatedAt timestamp before update operations
userSchema.pre("updateOne", function () {
  this.set({ updatedAt: new Date() });
});

// Check if the model is already initialized to avoid re-initialization
let UserModel;
try {
  UserModel = mongoose.model("User");
} catch {
  UserModel = mongoose.model("User", userSchema);
}

export default UserModel;
