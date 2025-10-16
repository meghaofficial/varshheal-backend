import mongoose from "mongoose";
const User = mongoose.model("user");

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      unique: true,
    },

    // Default to user's name if not provided
    name: {
      type: String,
      trim: true,
      default: async function () {
        if (this.name) return this.name;
        const user = await User.findById(this.userId).select("name").lean();
        return user?.name || "";
      },
    },

    phone: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^[6-9]\d{9}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },

    alternate_phone: {
      type: String,
      validate: {
        validator: function (v) {
          if (!v) return true; // optional
          return /^[6-9]\d{9}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid alternate phone!`,
      },
    },

    pincode: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^[1-9][0-9]{5}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid pincode!`,
      },
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

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: { type: [Number], default: [] }, // [lng, lat]
      formatted_address: { type: String, trim: true },
    },

    isAutoDetected: { type: Boolean, default: false },
  },
  { timestamps: true }
);

addressSchema.index({ location: "2dsphere" });

const Address = mongoose.model("address", addressSchema);
export default Address;
