const router = require("express").Router();
const multer = require("../config/multer");
const uploadSingle = require("../middleware/uploadSingle");

const {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategoryFields,
  updateBanner,
  updateIcon,
  getCategoryTree,
  deleteCategory,
  bulkUploadCategories,
} = require("../controller/newCategoryController");
const {
  isAuthenticated,
  isAuthorized,
} = require("../middleware/authMiddleware");
const uploadMultiple = require("../middleware/uploadMultiple");
const uploadCategoryImages = require("../middleware/uploadCategoryImages");

router.get("/categories/tree", getCategoryTree);
// GET /categories?search=winter&active=true&featured=false&page=1&limit=20
router.get("/categories", getAllCategories);

// CREATION
router.post(
  "/categories",
  isAuthenticated,
  isAuthorized,
  (req, res, next) => {
    req.folderName = "category"; // cloudinary folder
    next();
  },
  multer.fields([
    { name: "banner", maxCount: 1 },
    { name: "icon", maxCount: 1 },
  ]),
  uploadCategoryImages, // cloudinary upload middleware
  createCategory
);
router.post(
  "/categories/bulk-upload",
  isAuthenticated,
  isAuthorized,
  bulkUploadCategories
);
// UPDATION
router.patch(
  "/categories/:id",
  isAuthenticated,
  isAuthorized,
  updateCategoryFields
);
router.put(
  "/categories/:id/banner",
  isAuthenticated,
  isAuthorized,
  (req, res, next) => {
    req.folderName = "category/banner";
    next();
  },
  multer.single("banner"),
  uploadSingle,
  updateBanner
);
router.put(
  "/categories/:id/icon",
  isAuthenticated,
  isAuthorized,
  (req, res, next) => {
    req.folderName = "category/icon";
    next();
  },
  multer.single("icon"),
  uploadSingle,
  updateIcon
);

// Read Operations (no middleware needed)
router.get("/categories/:id", getSingleCategory);
router.delete("/categories/:id", isAuthenticated, isAuthorized, deleteCategory);

module.exports = router;
