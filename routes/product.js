const {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductByID,
  deleteMultipleProducts,
} = require("../controller/productController");
const {
  isAuthenticated,
  isAuthorized,
} = require("../middleware/authMiddleware");
const {
  uploadImage,
  uploadExcel,
  uploadProductImages,
  uploadSizeChart,
} = require("../middleware/upload");
const Product = require("../models/Product");
const xlsx = require("xlsx");
const paginate = require("../utilities/paginate");

const router = require("express").Router();

router.post(
  "/create-product",
  isAuthenticated,
  isAuthorized,
  uploadProductImages.fields([
    { name: "img1", maxCount: 1 },
    { name: "img2", maxCount: 1 },
    { name: "img3", maxCount: 1 },
    { name: "img4", maxCount: 1 },
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

      if (!data.length) {
        return res.status(200).json({
          success: true,
          message: "0 product(s) added successfully",
          product: null,
          products: [],
        });
      }

      const dataR = data.map((item) => ({
        ...item,
        color:
          typeof item.color === "string"
            ? item.color.split(",").map((c) => c.trim())
            : item.color,

        size:
          typeof item.size === "string"
            ? item.size.split(",").map((s) => s.trim())
            : item.size,

        tags:
          typeof item.tags === "string"
            ? item.tags.split(",").map((c) => c.trim())
            : item.tags,

        description:
          typeof item.description === "string"
            ? item.description.split(",").map((c) => c.trim())
            : item.description,
      }));

      // Insert into DB (example)
      const insertedProducts = await Product.insertMany(dataR);
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
    { name: "img1", maxCount: 1 },
    { name: "img2", maxCount: 1 },
    { name: "img3", maxCount: 1 },
    { name: "img4", maxCount: 1 },
    { name: "size_chart", maxCount: 1 },
  ]),
  updateProduct
);
router.delete(
  "/delete-product/:id",
  isAuthenticated,
  isAuthorized,
  deleteProduct
);
router.post(
  "/delete-products",
  isAuthenticated,
  isAuthorized,
  deleteMultipleProducts
);

module.exports = router;
