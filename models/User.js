const mongoose = require("mongoose");

// for email
const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      index: true,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      index: true,
    },
    name: String,
    avatar: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);
// for phone
const userSchema2 = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  otp: String,
  otpExpires: Date,
});

const User = mongoose.model("user", userSchema);
const User2 = mongoose.model("user2", userSchema2);

module.exports = { User, User2 };
