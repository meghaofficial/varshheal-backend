const Category = require("../models/Category");
const Product = require("../models/Product");
const XLSX = require("xlsx");

// const createProduct = async (req, res) => {
//   try {
//     const {
//       sku,
//       name,
//       categoryId,
//       categoryName,
//       price,
//       discount,
//       stock,
//       tags,
//       description,
//       specified_by,
//       size,
//       color,
//       material,
//       target_audience,
//       fit_type,
//       pattern,
//       occasion,
//       care_instruction,
//       dimensions,
//       closure_type,
//       capacity,
//       compartment_details,
//       strap_type,
//       status,
//     } = req.body;

//     if (!sku || !name || !categoryId || !categoryName || !price || !stock) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Required fields: sku, name, categoryId, categoryName, price, stock",
//       });
//     }

//     // 🧩 Handle images & size_chart from Cloudinary
//     const images = req.files?.images
//       ? req.files.images.map((file) => file.path)
//       : [];
//     const size_chart = req.files?.size_chart
//       ? req.files.size_chart[0].path
//       : null;

//     if (images.length < 1 || images.length > 4) {
//       return res.status(400).json({
//         success: false,
//         message: "Please upload between 1 and 4 images",
//       });
//     }

//     const newProduct = new Product({
//       sku,
//       name,
//       categoryDetail: {
//         categoryId,
//         categoryName,
//       },
//       images,
//       size_chart,
//       price,
//       discount,
//       stock,
//       tags,
//       description,
//       specified_by,
//       size,
//       color,
//       material,
//       target_audience,
//       fit_type,
//       pattern,
//       occasion,
//       care_instruction,
//       dimensions,
//       closure_type,
//       capacity,
//       compartment_details,
//       strap_type,
//       status: status || "draft",
//     });

//     const savedProduct = await newProduct.save();

//     await Category.findByIdAndUpdate(categoryId, { $inc: { products: 1 } });

//     res.status(201).json({
//       success: true,
//       message: "Product created successfully",
//       product: savedProduct,
//     });
//   } catch (error) {
//     console.error("Error creating product:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to create product",
//       error: error.message,
//     });
//   }
// };

const createProduct = async (req, res) => {
  try {
    let products = [];

    const parseArray = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val.map((x) => x.toString().trim());

      const str = val.toString().trim();
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) return parsed.map((x) => x?.toString().trim());
      } catch {
        return str
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
      }

      return [];
    };

    const parseObject = (val) => {
      if (!val) return {};
      if (typeof val === "object" && !Array.isArray(val)) return val;

      const str = val.toString().trim();
      try {
        const parsed = JSON.parse(str);
        if (typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
      } catch {
        const obj = {};
        str.split(",").forEach((pair) => {
          const [k, v] = pair.split(":").map((x) => x?.trim());
          if (k && v) obj[k] = v;
        });
        return obj;
      }
      return {};
    };


    // Excel
    if (req.file && req.file.mimetype.includes("spreadsheet")) {
      const workbook = XLSX.readFile(req.file.path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);

      products = data.map((item) => ({
        sku: item.sku?.toString().trim(),
        name: item.name?.toString().trim(),
        categoryDetail: {
          categoryId: item.categoryId?.toString().trim() || "",
          categoryName: item.categoryName?.toString().trim() || "",
        },
        price: Number(item.price) || 0,
        discount: Number(item.discount) || 0,
        stock: Number(item.stock) || 0,
        tags: parseArray(item.tags),
        description: parseArray(item.description),
        specified_by: item.specified_by || "none",
        size: parseArray(item.size),
        color: parseArray(item.color),
        material: item.material || "",
        target_audience: item.target_audience || "",
        fit_type: item.fit_type || "",
        pattern: item.pattern || "",
        occasion: item.occasion || "",
        care_instruction: item.care_instruction || "",
        dimensions: parseObject(item.dimensions),
        closure_type: item.closure_type || "",
        capacity: item.capacity || "",
        compartment_details: item.compartment_details || "",
        strap_type: item.strap_type || "",
        images: parseArray(item.images),
        size_chart: item.size_chart || "",
        status: item.status || "draft",
      }));
    }

    // Manual product
    else if (req.body.name && req.body.sku) {
      const {
        sku,
        name,
        categoryId,
        categoryName,
        price,
        discount,
        stock,
        tags,
        description,
        specified_by,
        size,
        color,
        material,
        target_audience,
        fit_type,
        pattern,
        occasion,
        care_instruction,
        dimensions,
        closure_type,
        capacity,
        compartment_details,
        strap_type,
        status="draft",
      } = req.body;

      // Validation
      if (!sku || !name || !categoryId || !categoryName || !price || !stock) {
        return res.status(400).json({
          success: false,
          message:
            "Required fields: sku, name, categoryId, categoryName, price, stock",
        });
      }

      const images = req.files?.images?.map((f) => f.path) || [];
      const size_chart = req.files?.size_chart?.[0]?.path || "";

      products.push({
        sku: sku.trim(),
        name: name.trim(),
        categoryDetail: { categoryId: categoryId.trim(), categoryName: categoryName.trim() },
        images,
        size_chart,
        price: Number(price) || 0,
        discount: Number(discount) || 0,
        stock: Number(stock) || 0,
        tags: parseArray(tags),
        description: parseArray(description),
        specified_by: specified_by || "none",
        size: parseArray(size),
        color: parseArray(color),
        material,
        target_audience,
        fit_type,
        pattern,
        occasion,
        care_instruction,
        dimensions: parseObject(dimensions),
        closure_type,
        capacity,
        compartment_details,
        strap_type,
        status: status || "draft",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Please provide product details or upload an Excel file",
      });
    }

    /** -----------------------------
     * Remove Duplicates (SKU check)
     * ----------------------------- */
    const existing = await Product.find(
      { sku: { $in: products.map((p) => p.sku) } },
      "sku"
    );
    const existingSKUs = new Set(existing.map((p) => p.sku));
    const newProducts = products.filter((p) => !existingSKUs.has(p.sku));

    if (newProducts.length === 0) {
      return res.status(200).json({
        success: false,
        message: "No new products added — all SKUs already exist.",
      });
    }

    /** -----------------------------
     * Save & Update Category Counts
     * ----------------------------- */
    const savedProducts = await Product.insertMany(newProducts, { ordered: false });

    for (const product of savedProducts) {
      if (product.categoryDetail?.categoryId) {
        await Category.findByIdAndUpdate(product.categoryDetail.categoryId, {
          $inc: { products: 1 },
        });
      }
    }

    /** -----------------------------
     * Success Response
     * ----------------------------- */
    return res.status(201).json({
      success: true,
      message: `${savedProducts.length} product(s) added successfully`,
      products: savedProducts,
      product: savedProducts.length === 1 ? savedProducts[0] : null,
    });

  } catch (error) {
    console.error("Error creating product:", error);

    // Friendly message for duplicate SKU even if unique:false
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate SKU detected. Product with same SKU already exists.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create products",
      error: error.message,
    });
  }
};

module.exports = { createProduct };

const updateProduct = async (req, res) => {};

const deleteProduct = async (req, res) => {};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
};
