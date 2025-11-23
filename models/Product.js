const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },

    categoryDetail: {
      categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "category",
      },
      categoryName: {
        type: String,
        trim: true,
      },
    },
    // images: {
    //   type: [String],
    // },
    images: {
      img1: String,
      img2: String,
      img3: String,
      img4: String
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
    },

    tags: {
      type: [String],
      default: [],
    },

    description: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message: "Description cannot be empty.",
      },
    },

    specified_by: {
      type: String,
      enum: ["none", "clothing", "bags"],
      required: true,
      default: "none",
    },

    // 🧵 Common attributes for clothing or bags
    size: {
      type: [String],
      default: [], // applicable for clothing
    },

    color: {
      type: [String],
      default: [], // applicable for clothing/bags
    },

    material: {
      type: String, // applicable for clothing/bags
    },

    size_chart: {
      type: String, // Cloudinary image URL
      default: "",
    },

    target_audience: {
      type: String, // e.g. "Men", "Women", "Unisex"
      trim: true,
    },

    fit_type: {
      type: String, // e.g. "Regular Fit", "Slim Fit"
      trim: true,
    },

    pattern: {
      type: String, // e.g. "Solid", "Striped", etc.
      trim: true,
    },

    occasion: {
      type: String, // e.g. "Casual", "Formal"
      trim: true,
    },

    care_instruction: {
      type: String, // multiple bullet points,
    },

    // 🎒 Bags-specific fields
    dimensions: {
      length: { type: Number, min: 0 },
      breadth: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
    },

    closure_type: {
      type: String, // e.g. "Zipper", "Magnetic"
      trim: true,
    },

    capacity: {
      type: String, // e.g. "25L"
      trim: true,
    },

    compartment_details: {
      type: String, // short sentence
      trim: true,
    },

    strap_type: {
      type: String, // e.g. "Adjustable", "Double Handle"
      trim: true,
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// productSchema.virtual("reviews", {
//   ref: "review",
//   localField: "_id",
//   foreignField: "productId"
// });
// await Product.findById(id).populate("reviews");

const Product = mongoose.model("product", productSchema);
module.exports = Product;