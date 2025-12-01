// ADMIN ROUTES

const NewCategory = require("../models/NewCategory");
const NewProduct = require("../models/NewProduct");
const XLSX = require("xlsx");
const {
  extractPublicId,
  getPublicIdFromUrl,
  deleteFromCloudinary,
} = require("../utilities/helper");

const createProduct = async (req, res) => {
  try {
    const {
      title,
      brand,
      category,
      description,
      price,
      discountPercentage = 0,
      variants,
    } = req.body;

    if (!title || !brand || !category || !price) {
      return res.status(400).json({
        message: "title, brand, category & price are required.",
      });
    }

    // Validate category
    const categoryExists = await NewCategory.findById(category);
    if (!categoryExists) {
      return res.status(404).json({ message: "Category not found" });
    }

    const parsedVariants = variants ? JSON.parse(variants) : [];

    // --------------------------
    // PROCESS UPLOADED IMAGES
    // --------------------------
    let imgIndex = 0; // pointer for req.uploadedImages

    parsedVariants.forEach((variant) => {
      if (!variant.images || variant.images.length === 0) return;

      variant.images = variant.images.map((imgTemplate) => {
        const uploadedImg = req.uploadedImages?.[imgIndex];

        if (uploadedImg) {
          imgIndex++;
          return {
            url: uploadedImg.url,
            public_id: uploadedImg.public_id,
            position: imgTemplate.position, // keep original position
          };
        }

        return imgTemplate; // fallback (should not normally happen)
      });
    });

    // Calculate discounted price
    const discountedPrice = price - price * (discountPercentage / 100);

    const newProduct = new NewProduct({
      title,
      brand,
      category,
      description: description ? JSON.parse(description) : undefined,
      price,
      discountPercentage,
      discountedPrice,
      variants: parsedVariants,
    });

    const savedProduct = await newProduct.save();

    return res.status(201).json({
      message: "Product created successfully",
      product: savedProduct,
    });
  } catch (err) {
    console.log("Product Creation Error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

const bulkUploadProducts = async (req, res) => {
  try {
    const { products: incomingProducts } = req.body;

    if (!incomingProducts || incomingProducts.length === 0) {
      return res.status(400).json({ message: "No product data received" });
    }

    const products = [];

    for (const row of incomingProducts) {
      // Validate categoryName
      if (!row.categoryName) {
        return res.status(400).json({
          message: `categoryName missing for product ${row.title}`,
        });
      }

      const category = await NewCategory.findOne({
        name: row.categoryName.trim(),
      });

      if (!category) {
        return res.status(400).json({
          message: `Invalid categoryName "${row.categoryName}" for product "${row.title}"`,
        });
      }

      // Description
      const description = {
        paragraph: row.descriptionParagraph || "",
        points: Array.isArray(row.descriptionPoints)
          ? row.descriptionPoints
          : [],
        specs: typeof row.specs === "object" ? row.specs : {},
      };

      // Variants
      const variants = Array.isArray(row.variants) ? row.variants : [];

      // FIX: AUTO-FILL public_id IF MISSING
      variants.forEach((variant) => {
        variant.images?.forEach((img) => {
          if (!img.public_id || img.public_id.trim() === "") {
            img.public_id = getPublicIdFromUrl(img.url);
          }
        });
      });

      // Pricing
      const discountPercentage = row.discountPercentage || 0;
      const discountedPrice =
        row.price - row.price * (discountPercentage / 100);

      // Product object
      products.push({
        title: row.title,
        brand: row.brand,
        category: category._id,
        price: row.price,
        discountPercentage,
        discountedPrice,
        description,
        variants,
        isFeatured: false,
        isActive: false,
      });
    }

    await NewProduct.insertMany(products);

    res.status(201).json({
      message: "Bulk upload successful",
      count: products.length,
      products,
    });
  } catch (err) {
    console.error("Bulk Upload Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const productId = req.params.productId;

    const {
      title,
      brand,
      category,
      description,
      isActive,
      isFeatured,
      discountPercentage,
    } = req.body;

    // Validate category if provided
    if (category) {
      const categoryExists = await NewCategory.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
    }

    const updatedProduct = await NewProduct.findByIdAndUpdate(
      productId,
      {
        ...(title && { title }),
        ...(brand && { brand }),
        ...(category && { category }),
        ...(description && { description }),
        ...(typeof isActive !== "undefined" && { isActive }),
        ...(typeof isFeatured !== "undefined" && { isFeatured }),
        ...(discountPercentage && { discountPercentage }),
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (err) {
    console.error("Update Product Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updateVariant = async (req, res) => {
  try {
    const productId = req.params.productId;
    const { variants } = req.body; // Array of variants

    const product = await NewProduct.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    variants.forEach((incomingVar) => {
      const existingVar = product.variants.id(incomingVar._id);
      if (existingVar) {
        existingVar.colorName = incomingVar.colorName;
        existingVar.colorCode = incomingVar.colorCode;
        existingVar.stock = incomingVar.stock;
        // Do NOT update images here
      }
    });

    await product.save();

    res.json({
      message: "Variants updated successfully",
      product,
    });
  } catch (err) {
    console.error("Update Variant Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// THIS IS NOT WORKING PLEASE HAVE A LOOK
const updateVariantImages = async (req, res) => {
  try {
    const productId = req.params.productId;

    const incomingVariants = JSON.parse(req.body.variants);
    const product = await NewProduct.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const uploadedFiles = req.uploadedImages || [];
    let uploadIndex = 0;

    for (const incomingVar of incomingVariants) {
      const existingVar = product.variants.id(incomingVar._id);
      if (!existingVar) continue;

      // O(1) lookup for old images by position
      const oldImages = {};
      for (const img of existingVar.images) {
        oldImages[img.position] = img;
      }

      const newImages = [];

      // MAIN LOOP: process each incoming image (NO nested loops)
      for (const incomingImg of incomingVar.images) {
        const pos = incomingImg.position;
        const oldImg = oldImages[pos] || null;

        // CASE 1 → NEW FILE FROM FRONTEND
        if (incomingImg.file === true || incomingImg.file instanceof Object) {
          const file = uploadedFiles[uploadIndex];

          if (!file) {
            return res.status(400).json({
              message: "File indexing mismatch. Check FormData order."
            });
          }

          // Delete old image (if existed)
          if (oldImg?.public_id) {
            await deleteFromCloudinary(oldImg.public_id);
          }

          // Use uploaded cloudinary file
          newImages.push({
            url: file.url,
            public_id: file.public_id,
            position: pos
          });

          uploadIndex++;
          continue;
        }

        // CASE 2 → CLOUDINARY URL SENT
        if (typeof incomingImg.url === "string" && incomingImg.url.startsWith("http")) {

          // NEW POSITION (oldImg doesn't exist)
          if (!oldImg) {
            newImages.push({
              url: incomingImg.url,
              public_id: incomingImg.public_id || getPublicIdFromUrl(incomingImg.url),
              position: pos
            });
            continue;
          }

          // URL CHANGED → old must be deleted
          if (oldImg.url !== incomingImg.url) {
            await deleteFromCloudinary(oldImg.public_id);

            newImages.push({
              url: incomingImg.url,
              public_id: incomingImg.public_id || getPublicIdFromUrl(incomingImg.url),
              position: pos
            });
            continue;
          }

          // URL SAME → KEEP OLD
          newImages.push(oldImg);
          continue;
        }

        // CASE 3 → NO URL, NO FILE → KEEP OLD
        if (oldImg) {
          newImages.push(oldImg);
        }
      }

      existingVar.images = newImages;
    }

    await product.save();

    res.json({
      message: "Variant images updated successfully",
      product
    });

  } catch (err) {
    console.error("Update Variant Images Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


const updateStockOfVariant = async (req, res) => {};

const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.productId;

    // Find product
    const product = await NewProduct.findById(productId);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Delete all Cloudinary images in all variants
    for (const variant of product.variants) {
      for (const img of variant.images) {
        if (img.public_id) {
          await deleteFromCloudinary(img.public_id);
        }
      }
    }

    // Delete product document
    await NewProduct.findByIdAndDelete(productId);

    res.status(200).json({
      message: "Product deleted successfully",
      productId,
      success: true,
    });

  } catch (err) {
    console.error("Delete Product Error:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};


const deleteVariant = async (req, res) => {};

const removeImages = async (req, res) => {};

// PUBLIC ROUTES

const getCategoryAndDescendants = async (categoryId) => {
  const categories = await NewCategory.find();
  const map = {};

  categories.forEach((cat) => {
    if (!map[cat.parent]) map[cat.parent] = [];
    map[cat.parent].push(cat._id.toString());
  });

  const ids = [categoryId];
  const stack = [categoryId];

  while (stack.length) {
    const current = stack.pop();
    const children = map[current] || [];

    for (const child of children) {
      ids.push(child);
      stack.push(child);
    }
  }

  return ids;
};
const getAllProducts = async (req, res) => {
  try {
    // -----------------------------
    // PAGINATION
    // -----------------------------
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // -----------------------------
    // BUILD QUERY OBJECT
    // -----------------------------
    let filters = {};

    if (req.query.isActive) filters.isActive = req.query.isActive;
    if (req.query.isFeatured) filters.isFeatureda = req.query.isFeatured;

    // -----------------------------
    // SEARCH (title, brand)
    // -----------------------------
    if (req.query.search && req.query.search.trim() !== "") {
      const search = req.query.search.trim();
      filters.$or = [
        { title: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    // -----------------------------
    // CATEGORY FILTER (with children)
    // -----------------------------
    if (req.query.category) {
      const categoryId = req.query.category;

      // Fetch category + child categories
      const allCategoryIds = await getCategoryAndDescendants(categoryId);

      filters.category = { $in: allCategoryIds };
    }

    // -----------------------------
    // BRAND FILTER
    // -----------------------------
    if (req.query.brand) {
      filters.brand = req.query.brand;
    }

    // -----------------------------
    // PRICE FILTER
    // -----------------------------
    if (req.query.minPrice || req.query.maxPrice) {
      filters.price = {};
      if (req.query.minPrice) filters.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filters.price.$lte = Number(req.query.maxPrice);
    }

    // -----------------------------
    // FEATURED FILTER
    // -----------------------------
    //     if (req.query.featured === "true") {
    //       filters.isFeatured = true;
    //     }

    // -----------------------------
    // SORTING
    // -----------------------------
    let sort = {};

    switch (req.query.sort) {
      case "price_low_high":
        sort.price = 1;
        break;
      case "price_high_low":
        sort.price = -1;
        break;
      case "newest":
        sort.createdAt = -1;
        break;
      case "oldest":
        sort.createdAt = 1;
        break;
      case "rating":
        sort["rating.average"] = -1;
        break;
      default:
        sort.createdAt = -1; // default latest first
    }

    // -----------------------------
    // EXECUTE QUERY
    // -----------------------------
    const totalProducts = await NewProduct.countDocuments(filters);

    const products = await NewProduct.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("category", "name slug") // optional populate
      .lean();

    products.forEach((product) => {
      product.totalStock =
        product.variants?.reduce((sum, v) => {
          return sum + (v.stock || 0);
        }, 0) || 0;
    });

    res.json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
      results: products.length,
      products,
    });
  } catch (err) {
    console.error("Get Products Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getSpecificProduct = async (req, res) => {};

const getCategorySpecificProduct = async (req, res) => {};

module.exports = {
  createProduct,
  bulkUploadProducts,
  getAllProducts,
  updateProduct,
  updateVariant,
  updateVariantImages,
  deleteProduct
};
