const { bulkUploadProducts, createProduct, getAllProducts, updateProduct, updateVariantImages, updateVariant, deleteProduct } = require('../controller/newProductController');
const { isAuthenticated, isAuthorized } = require('../middleware/authMiddleware');
const uploadMultiple = require('../middleware/uploadMultiple');
const upload = require("../config/multer");  
const router = require('express').Router();

// GET
router.get("/products", getAllProducts);

// CREATION
router.post(
  "/products",
  isAuthenticated,
  isAuthorized,
  (req, res, next) => {
    req.folderName = "product";  // Cloudinary folder
    next();
  },
  upload.array("images"),    // multiple files from frontend
  uploadMultiple,            // uploads all files to Cloudinary
  createProduct             // controller
);
router.post(
  "/products/bulk-upload",
  isAuthenticated,
  isAuthorized,
  bulkUploadProducts
);

// UPDATION
// UPDATE PRODUCT
router.put("/products/:productId", updateProduct);

// UPDATE VARIANTS (no images)
router.put("/products/:productId/variants", updateVariant);

// UPDATE VARIANT IMAGES (delete old → add new)
router.put(
  "/products/:productId/variant-images",
  (req, res, next) => {
    req.folderName = "products"; // change if you want
    next();
  },
  upload.array("images"),    // field name for files from frontend
  uploadMultiple,            // uploads to Cloudinary → sets req.uploadedImages
  updateVariantImages        // your smart controller
);

// DELETION
router.delete("/products/:productId", isAuthenticated, isAuthorized, deleteProduct);


module.exports = router;