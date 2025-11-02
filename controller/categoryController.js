const XLSX = require("xlsx");
const Category = require("../models/Category");
const cloudinary = require("cloudinary").v2;

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
    const { name, products, status, newId } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Category ID (Mongo _id) is required in params.",
      });
    }

    // Find existing category
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    // Check duplicate category `id` or `name` if changed
    if (newId && newId !== category.id) {
      const existingId = await Category.findOne({ id: newId });
      if (existingId) {
        return res.status(400).json({
          success: false,
          message: "Category ID already exists.",
        });
      }
      category.id = newId;
    }

    if (name && name !== category.name) {
      const existingName = await Category.findOne({ name });
      if (existingName) {
        return res.status(400).json({
          success: false,
          message: "Category name already exists.",
        });
      }
      category.name = name;
    }

    // Handle Cloudinary image update if a new file is uploaded
    if (req.file) {
      // Delete previous Cloudinary image (optional)
      if (category.thumbnail && category.thumbnail.includes("cloudinary")) {
        const publicId = category.thumbnail.split("/").pop().split(".")[0];
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.warn("Failed to delete old image:", err.message);
        }
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "categories",
      });
      category.thumbnail = result.secure_url;
    }

    // Update other fields
    if (products !== undefined) category.products = products;
    if (status) category.status = status;

    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully.",
      category,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update category.",
      error: error.message,
    });
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

    // Remove thumbnail from server if it exists
    // if (category.thumbnail && fs.existsSync(category.thumbnail)) {
    //   fs.unlinkSync(category.thumbnail);
    // }

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
