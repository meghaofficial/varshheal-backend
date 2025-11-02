const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
      id: {
            type: String,
            required: true
      },
      name: {
            type: String,
            required: true
      },
      products: {
            type: Number,
            required: true, 
            default: 0
      },
      thumbnail: {
            type: String,
      },
      status: {
            type: "String",
            required: true,
            default: "draft"
      }
});

const Category = mongoose.model("category", categorySchema);
module.exports = Category;