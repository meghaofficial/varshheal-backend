const cloudinary = require("../config/cloudinary");
const mongoose = require("mongoose");

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
}

const deleteCloudinaryImage = async (url, folder) => {
  if (!url || !url.includes("cloudinary")) return;

  try {
    const publicId = url.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(`${folder}/${publicId}`);
  } catch (err) {
    console.warn(`⚠ Failed to delete Cloudinary image: ${err.message}`);
  }
};

// const productFilter = (params = {}) => {
//   const {
//     categoryId,
//     priceMin,
//     priceMax,
//     ratingMin,
//     ratingMax,
//     color,
//     search,
//   } = params;

//   let query = {};

//   // ⭐ Category filter (your schema uses categoryDetail.categoryId)
//   if (categoryId) {
//     query["categoryDetail.categoryId"] = categoryId;
//   }

//   // ⭐ Price filter (supports min & max)
//   if (priceMin || priceMax) {
//     query.price = {};
//     if (priceMin) query.price.$gte = Number(priceMin);
//     if (priceMax) query.price.$lte = Number(priceMax);
//   }

//   // ⭐ Rating filter
//   if (ratingMin || ratingMax) {
//     query.rating = {};
//     if (ratingMin) query.rating.$gte = Number(ratingMin);
//     if (ratingMax) query.rating.$lte = Number(ratingMax);
//   }

//   // ⭐ Color filter (you store colors as array)
//   if (color) {
//     query.color = { $in: Array.isArray(color) ? color : [color] };
//   }

//   // ⭐ Search filter (name, id, or anything you want)
//   if (search) {
//     query.$or = [
//       { name: { $regex: search, $options: "i" } },
//       { sku: { $regex: search, $options: "i" } },
//     ];
//   }

//   return query;
// };

const productFilter = (params = {}) => {
  const {
    categoryId,
    priceMin,
    priceMax,
    ratingMin,
    ratingMax,
    color,
    search,
  } = params;

  let query = {};

  // ⭐ Category filter (supports single or multiple)
  if (categoryId) {
    const ids = Array.isArray(categoryId) ? categoryId : categoryId.split(",");
    query["categoryDetail.categoryId"] = { $in: ids };
  }

  // ⭐ Price filter
  if (priceMin || priceMax) {
    query.price = {};
    if (priceMin) query.price.$gte = Number(priceMin);
    if (priceMax) query.price.$lte = Number(priceMax);
  }

  // ⭐ Rating filter
  if (ratingMin || ratingMax) {
    query.rating = {};
    if (ratingMin) query.rating.$gte = Number(ratingMin);
    if (ratingMax) query.rating.$lte = Number(ratingMax);
  }

  // ⭐ Color filter (supports array or comma-separated)
  if (color) {
    const colors = Array.isArray(color)
      ? color
      : color.split(",").map((c) => c.trim().toLowerCase());

    query.color = { $in: colors };
  }

  // ⭐ Search (by name or sku)
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
    ];
  }

  return query;
};

module.exports = {
  generateOTP,
  deleteCloudinaryImage,
  productFilter,
};
