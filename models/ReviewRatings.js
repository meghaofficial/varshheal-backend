const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    reviewText: {
      type: String,
      trim: true,
    },

    images: [
      {
        type: String, // review image URLs
      },
    ],

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
  },
  { timestamps: true }
);


// Recalculate rating on each review creation
reviewSchema.post("save", async function () {
  const productId = this.productId;

  const stats = await this.constructor.aggregate([
    { $match: { productId } },
    {
      $group: {
        _id: "$productId",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  await mongoose.model("Product").findByIdAndUpdate(productId, {
    rating: {
      average: stats[0]?.averageRating || 0,
      count: stats[0]?.totalReviews || 0,
    },
  });
});

const Review = mongoose.model("review", reviewSchema);
module.exports = Review;
