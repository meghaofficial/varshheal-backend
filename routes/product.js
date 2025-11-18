const {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductByID,
} = require("../controller/productController");
const {
  isAuthenticated,
  isAuthorized,
} = require("../middleware/authMiddleware");
const { uploadImage, uploadExcel, uploadProductImages, uploadSizeChart } = require("../middleware/upload");
const Product = require("../models/Product");
const xlsx = require("xlsx");
const paginate = require("../utilities/paginate");

const router = require("express").Router();

router.post(
  "/create-product",
  isAuthenticated,
  isAuthorized,
  uploadImage.fields([
    { name: "images", maxCount: 4 },
    { name: "size_chart", maxCount: 1 },
  ]),
  createProduct
);
router.post(
  "/upload-products",
  isAuthenticated,
  isAuthorized,
  uploadExcel.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });
      }

      // Read the uploaded Excel file
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);

      console.log("Parsed Excel data:", data);

      if (!data.length) {
        return res.status(200).json({
          success: true,
          message: "0 product(s) added successfully",
          product: null,
          products: [],
        });
      }

      // Insert into DB (example)
      const insertedProducts = await Product.insertMany(data);
      return res.status(200).json({
        success: true,
        message: `${insertedProducts.length} product(s) added successfully`,
        products: insertedProducts,
      });
    } catch (error) {
      console.error("Upload error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create products",
        error: error.message,
      });
    }
  }
);
router.get(
  "/drafted-products",
  paginate(Product, { status: "draft" }),
  async (req, res) => {
    return res.json(res.paginationResult);
  }
);
router.get(
  "/published-products",
  paginate(Product, { status: "published" }),
  async (req, res) => {
    return res.json(res.paginationResult);
  }
);
router.get("/get-product-details/:id", getProductByID);
router.patch(
  "/update-product/:id",
  isAuthenticated,
  isAuthorized,
  uploadProductImages.fields([
    { name: "images", maxCount: 4 },
  ]),
  uploadSizeChart.single("size_chart"),
  updateProduct
);
router.delete(
  "/delete-product/:id",
  isAuthenticated,
  isAuthorized,
  deleteProduct
);

module.exports = router;
