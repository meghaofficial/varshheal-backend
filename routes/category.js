const { createCategory, updateCategory, deleteCategory, displayCategory } = require('../controller/categoryController');
const { isAuthenticated, isAuthorized } = require('../middleware/authMiddleware');
const { uploadImage, uploadExcel } = require('../middleware/upload');
const Category = require('../models/Category');
const paginate = require('../utilities/paginate');

const router = require('express').Router();

router.post("/create-category", isAuthenticated, isAuthorized, uploadImage.single("thumbnail"),  createCategory);
router.post("/upload-categories", uploadExcel.single("file"), createCategory);


router.patch("/update-category/:id", isAuthenticated, isAuthorized, uploadImage.single("thumbnail"), updateCategory);


router.delete("/delete-category/:id", isAuthenticated, isAuthorized, deleteCategory);
router.get("/drafted-categories", paginate(Category, { status: "draft" }), (req, res) => {
  res.status(200).json(res.paginationResult);
});
router.get("/published-categories", paginate(Category, { status: "published" }), (req, res) => {
  res.status(200).json(res.paginationResult);
});
router.get("/display-category", isAuthenticated, isAuthorized, displayCategory);

module.exports = router;