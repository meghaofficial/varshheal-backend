// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema(
//   {
//     googleId: {
//       type: String,
//       index: true,
//       unique: true,
//       sparse: true,
//     },
//     email: {
//       type: String,
//       index: true,
//     },
//     name: String,
//     avatar: String,
//     createdAt: {
//       type: Date,
//       default: Date.now,
//     },
//   },
//   { timestamps: true }
// );

// const User = mongoose.model("user", userSchema);

// module.exports = User

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    role: {
      type: Number,
      default: 1000,
    },
    googleId: {
      type: String,
      index: true,
      unique: true,
      sparse: true, // allows null for normal users
    },
    email: {
      type: String,
      index: true,
      unique: true,
      required: true,
    },
    password: {
      type: String, // only required for normal signup
    },
    name: {
      type: String,
      required: true
    },
    avatar: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("user", userSchema);
module.exports = User;
