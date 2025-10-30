const mongoose = require("mongoose");
const Address = require("./Address");

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
    gender: {
      type: String,
      required: true,
      default: "female"
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

// Cascade delete when user is deleted
userSchema.pre("findOneAndDelete", async function (next) {
  const userId = this.getQuery()["_id"];

  // Delete all related documents
  await Promise.all([
    Address.deleteMany({ userId }),
    // Order.deleteMany({ userId }),
    // Cart.deleteMany({ userId }),
    // Wishlist.deleteMany({ userId }),
  ]);

  next();
});

const User = mongoose.model("user", userSchema);
module.exports = User;