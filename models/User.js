const mongoose = require("mongoose");

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

const User = mongoose.model("user", userSchema);

module.exports = { User }
