const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    name: { type: String, trim: true },
    phone: {
      type: String,
      required: true,
      match: /^[6-9]\d{9}$/,
    },
    alternate_phone: {
      type: String,
      match: /^[6-9]\d{9}$/,
    },

    pincode: {
      type: String,
      required: true,
      match: /^[1-9][0-9]{5}$/,
    },
    locality: { type: String, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true },

    address_type: {
      type: String,
      enum: ["home", "work", "other"],
      default: "home",
    },
  },
  { timestamps: true }
);

// Optional optimization: you can create a compound index
addressSchema.index({ userId: 1, address: 1 }, { unique: false });

const Address = mongoose.model("address", addressSchema);
module.exports = Address;