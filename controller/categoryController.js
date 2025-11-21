const XLSX = require("xlsx");
const Category = require("../models/Category");
const cloudinary = require("cloudinary").v2;
const Product = require("../models/Product");

const createCategory = async (req, res) => {
  try {
    let categories = [];

    // Case 1: Excel Upload
    if (req.file && req.file.mimetype.includes("spreadsheet")) {
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);

      categories = data.map((item) => ({
        id: item.id?.toString().trim(),
        name: item.name?.toString().trim(),
        products: item.products || 0,
        thumbnail: item.thumbnail || "",
        status: item.status || "draft",
      }));
    }

    // Case 2: Single Category Upload
    else if (req.body.name && req.body.id) {
      const { id, name, products = 0, status = "draft" } = req.body;
      const thumbnail = req.file ? req.file.path : ""; // Cloudinary secure URL
      categories.push({
        id: id.toString().trim(),
        name: name.toString().trim(),
        products,
        thumbnail,
        status: status || "draft",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Please provide category details or upload an Excel file",
      });
    }

    // Fetch existing IDs and Names from DB
    const existingCategories = await Category.find(
      {
        $or: [
          { id: { $in: categories.map((c) => c.id) } },
          { name: { $in: categories.map((c) => c.name) } },
        ],
      },
      "id name"
    );

    const existingIds = new Set(existingCategories.map((c) => c.id));
    const existingNames = new Set(existingCategories.map((c) => c.name));

    // Filter out duplicates
    const newCategories = categories.filter(
      (c) => !existingIds.has(c.id) && !existingNames.has(c.name)
    );

    if (newCategories.length === 0) {
      return res.status(200).json({
        success: false,
        message: "No new categories added — all entries already exist.",
      });
    }

    // Insert unique categories only
    const result = await Category.insertMany(newCategories, { ordered: false });
    res.status(201).json({
      success: true,
      message: `${result.length} category(s) added successfully`,
      category: result.length === 1 ? result[0] : null,
      categories: result,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create categories",
      error: error.message,
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found." });
    }

    if (req.file) {
      // deleting old
      if (category.thumbnail && category.thumbnail.includes("cloudinary")) {
        const publicId = category.thumbnail.split("/").pop().split(".")[0];
        try {
          await cloudinary.uploader.destroy(`categories/${publicId}`);
        } catch (err) {
          console.warn("Failed to delete old image:", err.message);
        }
      }
      // updating new
      category.thumbnail = req.file.path;
    }

    // Update other fields
    if (req.body.name) category.name = req.body.name;
    if (req.body.newId) category.id = req.body.newId;
    if (req.body.status) category.status = req.body.status;

    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully.",
      category,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Update failed." });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the category
    const category = await Category.findById(id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    if (category.thumbnail && category.thumbnail.includes("cloudinary")) {
      const publicId = category.thumbnail.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(`categories/${publicId}`);
      } catch (err) {
        console.warn("Failed to delete old image:", err.message);
      }
    }

    // Find all products belonging to this category
    if (category?.products > 0) {
      const products = await Product.find({
        "categoryDetail.categoryId": category._id,
      });

      console.log("productsproductsproducts", products);

      for (const product of products) {
        // Delete image fields dynamically
        const imageKeys = ["img1", "img2", "img3", "img4"];

        for (const key of imageKeys) {
          if (
            product.images?.[key] &&
            product.images[key].includes("cloudinary")
          ) {
            const publicId = product.images[key].split("/").pop().split(".")[0];
            try {
              await cloudinary.uploader.destroy(`products/${publicId}`);
            } catch (err) {
              console.warn(
                `Failed to delete product image ${key}:`,
                err.message
              );
            }
          }
        }

        // Delete size_chart
        if (product.size_chart && product.size_chart.includes("cloudinary")) {
          const publicId = product.size_chart.split("/").pop().split(".")[0];
          try {
            await cloudinary.uploader.destroy(`products/${publicId}`);
          } catch (err) {
            console.warn("Failed to delete size chart:", err.message);
          }
        }
      }

      // Delete products from DB
      await Product.deleteMany({ "categoryDetail.categoryId": category._id });

    }

    // Delete the category
    await Category.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete category",
      error: error.message,
    });
  }
};

const showDraftedCategory = async (req, res) => {
  try {
    // Query params: ?page=1&limit=10&search=lock
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search ? req.query.search.trim() : "";

    const query = { status: "draft" };

    // Optional search by name or ID
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { id: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination logic
    const skip = (page - 1) * limit;

    // Fetch total count first
    const total = await Category.countDocuments(query);

    // Fetch paginated data
    const categories = await Category.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      categories,
    });
  } catch (error) {
    console.error("Error fetching drafted categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch drafted categories",
      error: error.message,
    });
  }
};

const displayCategory = async (req, res) => {};

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  showDraftedCategory,
  displayCategory,
};
