const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },

    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },

    icon: {
      url: String,
      public_id: String,
    },
    banner: {
      url: String,
      public_id: String,
    },

    description: String,

    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

categorySchema.index({ parent: 1 });

module.exports = mongoose.model("Category", categorySchema);


// parent is referencing itself for heirarchy categories
// Fashion
//  └── Men
//       └── Footwear
//            └── Sneakers

// for description for eg
// "Winter Wear offers jackets, sweaters, hoodies for cold weather."
