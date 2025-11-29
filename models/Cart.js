const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "product",
    required: true,
  },

  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },

  price: {
    type: Number,
    required: true,
  },

  // For variants like size, color (optional)
  variant: {
    type: Object,
    default: {}
  },

}, { _id: false });


const cartSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },

  items: [cartItemSchema],

  totalItems: {
    type: Number,
    default: 0
  },

  totalPrice: {
    type: Number,
    default: 0
  },

  // For guest users (optional)
  sessionId: {
    type: String
  }

}, { timestamps: true });


// Auto update totals before saving
cartSchema.pre("save", function(next) {
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.totalPrice = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  next();
});


module.exports = mongoose.model("cart", cartSchema);
