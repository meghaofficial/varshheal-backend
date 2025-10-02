const mongoose = require("mongoose");
require("dotenv").config();
const mongo_url = process.env.MONGO_URI;

mongoose
  .connect(mongo_url)
  .then(() => console.log("Connected to MongoDB"))
  .catch((e) => console.log("Failed to connect with database", e));
