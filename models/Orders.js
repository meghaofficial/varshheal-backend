const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // User placing the order
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    // Products in this order
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "product", required: true },
        quantity: { type: Number, required: true, min: 1 },
        priceAtPurchase: { type: Number, required: true }, // snapshot
        name: { type: String, required: true }, // redundancy for quick lookups
      },
    ],

    // Payment
    orderId: { type: String, required: true, unique: true },
    totalAmount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["cod", "razorpay", "stripe", "paypal", "upi"],
      default: "cod",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentId: { type: String }, // from Razorpay/Stripe/etc.

    // Shipping details
    shippingAddress: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },

    // Delivery integration
    courier: {
      partner: {
        type: String,
        enum: ["shiprocket", "delhivery", "bluedart", "xpressbees", null],
        default: null,
      },
      trackingId: { type: String },
      trackingUrl: { type: String },
      shipmentStatus: {
        type: String,
        enum: [
          "label_created",
          "in_transit",
          "out_for_delivery",
          "delivered",
          "cancelled",
          "rto_initiated",
          "rto_delivered",
          "failed",
        ],
        default: "label_created",
      },
    },

    // Order status
    status: {
      type: String,
      enum: ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },

    // Optional fields
    couponCode: { type: String },
    discountAmount: { type: Number, default: 0 },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

const Order = mongoose.model("order", orderSchema);
module.exports = Order;
