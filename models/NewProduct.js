const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    brand: { type: String, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    description: {
      paragraph: String,
      points: [String],
      specs: {
        type: Map,
        of: String,
      },
    },

    price: { type: Number, required: true },
    discountPercentage: { type: Number, default: 0 },
    discountedPrice: Number,

    variants: [
      {
        _id: false,
        colorName: { type: String, required: true },
        colorCode: { type: String },

        images: [
          {
            _id: false,
            url: { type: String, required: true },
            public_id: { type: String, required: true },
            position: Number,
          },
        ],

        stock: { type: Number, required: true },
      },
    ],

    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },

    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
