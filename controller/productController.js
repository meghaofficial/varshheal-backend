const Category = require("../models/Category");
const Product = require("../models/Product");
const XLSX = require("xlsx");

const createProduct = async (req, res) => {
  try {
    let products = [];

    const parseArray = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val.map((x) => x.toString().trim());
      const str = val.toString().trim();
      return str
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    };

    const parseObject = (val) => {
      if (!val) return {};
      if (typeof val === "object" && !Array.isArray(val)) return val;
      const obj = {};
      val
        .toString()
        .split(",")
        .forEach((pair) => {
          const [k, v] = pair.split(":").map((x) => x?.trim());
          if (k && v) obj[k] = v;
        });
      return obj;
    };

    if (!req.body.name || !req.body.sku) {
      return res.status(400).json({
        success: false,
        message: "Provide product fields",
      });
    }

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
      status = "draft",
    } = req.body;

    if (!sku || !name || !categoryId || !categoryName || !price || !stock) {
      return res.status(400).json({
        success: false,
        message: "Required: sku, name, categoryId, categoryName, price, stock",
      });
    }

    const images = req.files?.images?.map((f) => f.path) || [];
    const size_chart = req.files?.size_chart?.[0]?.path || "";

    const newProduct = {
      sku: sku.trim(),
      name: name.trim(),
      categoryDetail: { categoryId, categoryName },
      images,
      size_chart,
      price: Number(price),
      discount: Number(discount),
      stock: Number(stock),
      tags: parseArray(tags),
      description: parseArray(description),
      specified_by,
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
      status,
    };

    /** SKU CHECK */
    const exists = await Product.findOne({ sku });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "SKU already exists",
      });
    }

    const saved = await Product.create(newProduct);

    // Update category count
    await Category.findByIdAndUpdate(categoryId, { $inc: { products: 1 } });

    return res.status(201).json({
      success: true,
      message: `Product added successfully`,
      product: saved,
    });
  } catch (error) {
    console.error("Create product error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
};

const getProductByID = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ _id: id });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product Not Found",
      });
    }

    return res.status(200).json({
      success: true,
      details: product,
    });
  } catch (error) {
    console.error("Error getting product details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get product details.",
      error: error.message,
    });
  }
};

// const updateProduct = async (req, res) => {
//   try {
//     const productId = req.params.id;
//     const product = await Product.findById(productId);

//     if (!product) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Product not found" });
//     }

//     // Update all normal text fields
//     Object.keys(req.body).forEach((field) => {
//       if (field.includes("images")) return;
//       product[field] = req.body[field];
//     });

//     // IMAGE REPLACEMENT LOGIC
//     // if (req.files?.images) {
//     //   for (let fieldName in req.files.images) {
//     //     const index = parseInt(fieldName.match(/\[(\d+)\]/)[1]);
//     //     const file = req.files.images[fieldName][0];

//     //     // Upload new image
//     //     const upload = await cloudinary.uploader.upload(file.path, {
//     //       folder: "products",
//     //     });

//     //     // If product already has image at that index, replace it
//     //     if (product.images[index]) {
//     //       product.images[index] = upload.secure_url;
//     //     } else {
//     //       product.images.push(upload.secure_url); // fallback
//     //     }
//     //   }
//     // }

//     // SIZE CHART UPDATE
//     if (req.files?.size_chart) {
//       const upload = await cloudinary.uploader.upload(
//         req.files.size_chart[0].path,
//         {
//           folder: "size_charts",
//         }
//       );
//       product.size_chart = upload.secure_url;
//     }

//     await product.save();

//     return res.status(200).json({
//       success: true,
//       message: "Product updated successfully",
//       product,
//     });
//   } catch (err) {
//     console.log("UPDATE ERROR:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to update product",
//       error: err.message,
//     });
//   }
// };

const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Update normal text fields (name, price, etc.)
    Object.keys(req.body).forEach((field) => {
      product[field] = req.body[field];
    });

    // IMAGE UPDATE (AUTOMATIC BASED ON ORDER)
    if (req.files?.images) {
      for (let i = 0; i < req.files.images.length; i++) {
        const file = req.files.images[i];

        const upload = await cloudinary.uploader.upload(file.path, {
          folder: "products",
        });

        // Replace if exists — else push new
        if (product.images[i]) {
          product.images[i] = upload.secure_url;
        } else {
          product.images.push(upload.secure_url);
        }
      }
    }

    // SIZE CHART UPDATE
    if (req.files?.size_chart) {
      const upload = await cloudinary.uploader.upload(req.files.size_chart[0].path, {
        folder: "size_charts",
      });
      product.size_chart = upload.secure_url;
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: err.message,
    });
  }
};


const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the category
    const product = await Product.findById(id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Delete the category
    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
};

module.exports = {
  createProduct,
  getProductByID,
  updateProduct,
  deleteProduct,
};
