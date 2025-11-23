const Category = require("../models/Category");
const Product = require("../models/Product");
const XLSX = require("xlsx");
const cloudinary = require("cloudinary").v2;
const mongoose = require("mongoose");

const createProduct = async (req, res) => {
  try {
    let products = [];

    // This converts input into an array.
    // "red, blue, black" → ["red","blue","black"]
    // ["red","blue"] → returns as-is
    // empty → []
    const parseArray = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val.map((x) => x.toString().trim());
      const str = val.toString().trim();
      return str
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    };

    // This converts "key:value,key2:value2" into an object:
    // "height:30,width:50" → { height: "30", width: "50" }
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

    // const images = req.files?.images?.map((f) => f.path) || [];
    const images = {};
    if (req.files.img1) images.img1 = req.files.img1[0].path;
    if (req.files.img2) images.img2 = req.files.img2[0].path;
    if (req.files.img3) images.img3 = req.files.img3[0].path;
    if (req.files.img4) images.img4 = req.files.img4[0].path;

    const size_chart = req.files?.size_chart?.[0]?.path || "";

    const newProduct = {
      sku: sku.trim(),
      name: name.trim(),
      categoryDetail: {
        categoryId: new mongoose.Types.ObjectId(categoryId),
        categoryName,
      },
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

    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { sku: id };
    }

    const product = await Product.findOne(query);

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

    // const product = await Product.findOne({ _id: id });

    // if (!product) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Product Not Found",
    //   });
    // }

    // return res.status(200).json({
    //   success: true,
    //   details: product,
    // });
  } catch (error) {
    console.error("Error getting product details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get product details.",
      error: error.message,
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const normalFields = [
      "sku",
      "name",
      "price",
      "discount",
      "stock",
      "specified_by",
      "material",
      "target_audience",
      "fit_type",
      "pattern",
      "occasion",
      "care_instruction",
      "closure_type",
      "capacity",
    ];

    normalFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    if (req.body.categoryId || req.body.categoryName) {
      product.categoryDetail = {
        categoryId: req.body.categoryId
          ? new mongoose.Types.ObjectId(req.body.categoryId)
          : product.categoryDetail.categoryId,

        categoryName: req.body.categoryName
          ? req.body.categoryName
          : product.categoryDetail.categoryName,
      };
    }

    // array
    const parseArray = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val.map((x) => x.toString().trim());
      return val
        .toString()
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    };

    if (req.body.size) product.size = parseArray(req.body.size);
    if (req.body.color) product.color = parseArray(req.body.color);
    if (req.body.tags) product.tags = parseArray(req.body.tags);
    if (req.body.description)
      product.description = parseArray(req.body.description);

    // for dimensions
    const parseObject = (val) => {
      if (!val) return {};
      if (typeof val === "object") return val;
      const obj = {};
      val
        .toString()
        .split(",")
        .forEach((pair) => {
          const [k, v] = pair.split(":").map((x) => x.trim());
          if (k && v) obj[k] = v;
        });
      return obj;
    };

    if (req.body.dimensions) {
      product.dimensions = parseObject(req.body.dimensions);
    }

    // Update normal text fields (name, price, etc.)
    // Object.keys(req.body).forEach((field) => {
    //   product[field] = req.body[field];
    // });

    // let categoryDetail = {};
    // if (req.body.categoryId) categoryDetail.categoryId = req.body.categoryId
    // if (req.body.categoryName) categoryDetail.categoryName = req.body.categoryName;

    // product.categoryDetail = categoryDetail;

    const images = product?.images;

    // Img1
    if (req.files?.img1?.[0]) {
      // deleting old
      if (
        product?.images?.img1 &&
        product?.images?.img1?.includes("cloudinary")
      ) {
        const publicId = product?.images?.img1.split("/").pop().split(".")[0];
        try {
          await cloudinary.uploader.destroy(`products/${publicId}`);
        } catch (err) {
          console.warn("Failed to delete old image:", err.message);
        }
      }
      // updating new
      product.images.img1 = req.files?.img1?.[0]?.path;
    }
    // Img2
    if (req.files?.img2?.[0]) {
      // deleting old
      if (
        product?.images?.img2 &&
        product?.images?.img2?.includes("cloudinary")
      ) {
        const publicId = product?.images?.img2.split("/").pop().split(".")[0];
        try {
          await cloudinary.uploader.destroy(`products/${publicId}`);
        } catch (err) {
          console.warn("Failed to delete old image:", err.message);
        }
      }
      // updating new
      product.images.img2 = req.files?.img2?.[0]?.path;
    }
    // Img3
    if (req.files?.img3?.[0]) {
      // deleting old
      if (
        product?.images?.img3 &&
        product?.images?.img3?.includes("cloudinary")
      ) {
        const publicId = product?.images?.img3.split("/").pop().split(".")[0];
        try {
          await cloudinary.uploader.destroy(`products/${publicId}`);
        } catch (err) {
          console.warn("Failed to delete old image:", err.message);
        }
      }
      // updating new
      product.images.img3 = req.files?.img3?.[0]?.path;
    }
    // Img4
    if (req.files?.img4?.[0]) {
      // deleting old
      if (
        product?.images?.img4 &&
        product?.images?.img4?.includes("cloudinary")
      ) {
        const publicId = product?.images?.img4.split("/").pop().split(".")[0];
        try {
          await cloudinary.uploader.destroy(`products/${publicId}`);
        } catch (err) {
          console.warn("Failed to delete old image:", err.message);
        }
      }
      // updating new
      product.images.img4 = req.files?.img4?.[0]?.path;
    }

    // SIZE CHART UPDATE
    if (req.files?.size_chart) {
      // deleting old
      if (product?.size_chart && product?.size_chart?.includes("cloudinary")) {
        const publicId = product?.size_chart.split("/").pop().split(".")[0];
        try {
          await cloudinary.uploader.destroy(`products/${publicId}`);
        } catch (err) {
          console.warn("Failed to delete old image:", err.message);
        }
      }
      // updating new
      product.size_chart = req.files?.size_chart[0]?.path;
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

    // Deleting img1
    if (
      product?.images?.img1 &&
      product?.images?.img1?.includes("cloudinary")
    ) {
      const publicId = product?.images?.img1.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
      } catch (err) {
        console.warn("Failed to delete old image:", err.message);
      }
    }
    // deleting img2
    if (
      product?.images?.img2 &&
      product?.images?.img2?.includes("cloudinary")
    ) {
      const publicId = product?.images?.img2.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
      } catch (err) {
        console.warn("Failed to delete old image:", err.message);
      }
    }
    // deleting img3
    if (
      product?.images?.img3 &&
      product?.images?.img3?.includes("cloudinary")
    ) {
      const publicId = product?.images?.img3.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
      } catch (err) {
        console.warn("Failed to delete old image:", err.message);
      }
    }
    // deleting img4
    if (
      product?.images?.img4 &&
      product?.images?.img4?.includes("cloudinary")
    ) {
      const publicId = product?.images?.img4.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
      } catch (err) {
        console.warn("Failed to delete old image:", err.message);
      }
    }
    // deleting size chart
    if (product?.size_chart && product?.size_chart?.includes("cloudinary")) {
      const publicId = product?.size_chart.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
      } catch (err) {
        console.warn("Failed to delete old image:", err.message);
      }
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

const deleteMultipleProducts = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Product IDs must be provided as an array",
      });
    }

    // Fetch all products in one query
    const products = await Product.find({ _id: { $in: ids } });

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No products found for given IDs",
      });
    }

    // Loop through products and delete their images
    for (const product of products) {
      // Delete images img1–img4
      const imageKeys = ["img1", "img2", "img3", "img4"];

      for (const key of imageKeys) {
        const url = product?.images?.[key];
        if (url && url.includes("cloudinary")) {
          const publicId = url.split("/").pop().split(".")[0];
          try {
            await cloudinary.uploader.destroy(`products/${publicId}`);
          } catch (err) {
            console.warn("Image delete failed:", err.message);
          }
        }
      }

      // Delete size chart
      if (product?.size_chart?.includes("cloudinary")) {
        const publicId = product.size_chart.split("/").pop().split(".")[0];
        try {
          await cloudinary.uploader.destroy(`products/${publicId}`);
        } catch (err) {
          console.warn("Size chart delete failed:", err.message);
        }
      }
    }

    // Delete all product documents
    await Product.deleteMany({ _id: { $in: ids } });

    return res.status(200).json({
      success: true,
      message: "Products deleted successfully",
      deletedCount: products.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete products",
      error: error.message,
    });
  }
};

const getAllColors = async (req, res) => {
  try {
    const products = await Product.find({ status: "published" }, "color");
    const allColors = products.flatMap((p) => p.color || []);
    const uniqueColors = [...new Set(allColors)];

    return res.status(200).json({
      success: true,
      colors: uniqueColors,
    });
  } catch (error) {
    console.error("Error getting product colors:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get product colors.",
      error: error.message,
    });
  }
};

const getSimilarProducts = async (req, res) => {
  try {
    const { id } = req.params; // current product ID
    const limit = Number(req.query.limit) || 10;

    // get main product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Build similarity query
    const query = {
      _id: { $ne: id }, // exclude current product
      status: "published",
      $or: [
        { "categoryDetail.categoryId": product.categoryDetail.categoryId },
        { color: { $in: product.color } },
        { tags: { $in: product.tags } },
      ],
    };

    const similar = await Product.find(query)
      .limit(limit)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      similar,
    });
  } catch (error) {
    console.error("Similar product error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get similar products",
      error: error.message,
    });
  }
};

module.exports = {
  createProduct,
  getProductByID,
  updateProduct,
  deleteProduct,
  deleteMultipleProducts,
  getAllColors,
  getSimilarProducts
};
