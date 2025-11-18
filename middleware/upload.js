const multer = require("multer");
const path = require("path");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// 📘 For Cloudinary uploads (images)
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "categories",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
  },
});
const productImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "products",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
  },
});

// 📗 For Excel uploads (local)
const excelStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

// Two separate uploaders
const uploadImage = multer({ storage: cloudinaryStorage });
const uploadProductImages = multer({ storage: productImageStorage });
const uploadExcel = multer({
  storage: excelStorage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) cb(null, true);
    else cb(new Error("Only Excel files are allowed"));
  },
});

module.exports = { uploadImage, uploadExcel, uploadProductImages };
