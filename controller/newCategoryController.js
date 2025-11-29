const NewCategory = require("../models/NewCategory");
const {
  extractPublicId,
  deleteFromCloudinary,
} = require("../utilities/helper");

const createCategory = async (req, res) => {
  try {
    const { name, slug, description, parent, isFeatured, isActive } = req.body;

    let data = {
      name,
      slug,
      description,
      parent: parent || null,
      isFeatured,
      isActive,
    };

    // Add banner if uploaded
    if (req.uploadedImages?.banner) {
      data.banner = req.uploadedImages.banner;
    }

    // Add icon if uploaded
    if (req.uploadedImages?.icon) {
      data.icon = req.uploadedImages.icon; // icon is a simple string field
    }

    const newCategory = await NewCategory.create(data);

    res.status(201).json({
      success: true,
      category: newCategory,
    });
  } catch (err) {
    console.error("Create Category Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const bulkUploadCategories = async (req, res) => {
  try {
    const { categories } = req.body;

    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({ message: "Invalid category data" });
    }

    const createdCategories = [];

    for (const item of categories) {
      const {
        name,
        slug,
        parent,
        description,
        icon,
        banner,
        isActive,
        isFeatured,
      } = item;

      if (!name || !slug) {
        return res.status(400).json({
          message: "Each category must contain name and slug",
        });
      }

      const existing = await NewCategory.findOne({ slug });
      if (existing) continue;

      let parentId = null;

      if (parent && parent.trim() !== "") {
        let parentCategory = await NewCategory.findOne({ name: parent.trim() });

        if (!parentCategory) {
          parentCategory = await NewCategory.create({
            name: parent.trim(),
            slug: parent.trim().toLowerCase().replace(/\s+/g, "-"),
            parent: null,
            isActive: true,
            isFeatured: false,
          });
        }

        parentId = parentCategory._id;
      }

      const newCategory = await NewCategory.create({
        name,
        slug,
        parent: parentId,
        description: description || "",

        // FIX: save banner properly
        banner: banner
          ? {
              url: banner,
              public_id: extractPublicId(banner),
            }
          : null,

        // FIX: save icon properly
        icon: icon
          ? {
              url: icon,
              public_id: extractPublicId(icon),
            }
          : null,

        isActive: isActive ?? true,
        isFeatured: isFeatured ?? false,
      });

      createdCategories.push(newCategory);
    }

    return res.status(201).json({
      message: "Bulk upload completed",
      createdCount: createdCategories.length,
      data: createdCategories,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const {
      search = "",
      active, // boolean: true/false
      featured, // boolean: true/false
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    // ------------------------------------
    // 1️⃣ SEARCH FILTER
    // ------------------------------------

    if (search) {
      const regex = new RegExp(search, "i");

      query.$or = [
        { name: regex },
        { slug: regex },
        { description: regex },

        // Parent category name search (requires lookup)
        // handled in AGGREGATION below
      ];
    }

    // ------------------------------------
    // 2️⃣ ACTIVE FILTER
    // ------------------------------------
    if (active === "true") query.isActive = true;
    if (active === "false") query.isActive = false;

    // ------------------------------------
    // 3️⃣ FEATURED FILTER
    // ------------------------------------
    if (featured === "true") query.isFeatured = true;
    if (featured === "false") query.isFeatured = false;

    // ------------------------------------
    // 4️⃣ MONGO AGGREGATION (to include parent name + search in it)
    // ------------------------------------

    const pipeline = [
      { $match: query },

      // Join parent category
      {
        $lookup: {
          from: "categories",
          localField: "parent",
          foreignField: "_id",
          as: "parentData",
        },
      },
      {
        $unwind: {
          path: "$parentData",
          preserveNullAndEmptyArrays: true,
        },
      },

      // If search includes parent name
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { "parentData.name": new RegExp(search, "i") },
                  { name: new RegExp(search, "i") },
                  { slug: new RegExp(search, "i") },
                  { description: new RegExp(search, "i") },
                ],
              },
            },
          ]
        : []),

      // Add parent name for easier frontend usage
      {
        $addFields: {
          parentName: "$parentData.name",
        },
      },

      // Remove parentData object
      {
        $project: {
          parentData: 0,
        },
      },

      // Pagination
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) },
    ];

    const categories = await NewCategory.aggregate(pipeline);

    // Count total for pagination
    const totalResultsPipeline = [
      ...pipeline.slice(0, -2),
      { $count: "total" },
    ];
    const totalCountData = await NewCategory.aggregate(totalResultsPipeline);
    const total = totalCountData[0]?.total || 0;

    res.status(200).json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      categories,
    });
  } catch (error) {
    console.error("Get All Categories Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateCategoryFields = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent icon/banner updates here
    delete updates.banner;
    delete updates.icon;

    // If parent = empty string → set null
    if (updates.parent === "") updates.parent = null;

    const updated = await NewCategory.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({
      success: true,
      category: updated,
    });
  } catch (err) {
    console.error("Update Fields Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await NewCategory.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // If no file uploaded
    if (!req.uploadedImage) {
      return res.status(400).json({ message: "Banner image is required" });
    }

    // Delete old banner from Cloudinary
    if (category.banner?.public_id) {
      await deleteFromCloudinary(category.banner.public_id);
    }

    // Save new banner
    category.banner = {
      url: req.uploadedImage.url,
      public_id: req.uploadedImage.public_id,
    };

    await category.save();

    res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      category,
    });
  } catch (err) {
    console.error("Update Banner Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateIcon = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await NewCategory.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (!req.uploadedImage) {
      return res.status(400).json({ message: "Icon image is required" });
    }

    // Delete old icon
    if (category.icon?.public_id) {
      await deleteFromCloudinary(category.icon.public_id);
    }

    // Save new icon
    category.icon = {
      url: req.uploadedImage.url,
      public_id: req.uploadedImage.public_id,
    };

    await category.save();

    res.status(200).json({
      success: true,
      message: "Icon updated successfully",
      category,
    });
  } catch (err) {
    console.error("Update Icon Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getSingleCategory = async () => {};

// Only allow delete if:
// category has no child categories
// category has no products
// otherwise return
// { "message": "Category has children or products. Cannot delete." }
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await NewCategory.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // 1️⃣ Prevent deletion if category has child categories
    const hasChildren = await NewCategory.findOne({ parent: id });

    if (hasChildren) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete category with subcategories. Remove children first.",
      });
    }

    // 2️⃣ Delete banner from Cloudinary
    if (category.banner?.public_id) {
      await deleteFromCloudinary(category.banner.public_id);
    }

    // 3️⃣ Delete icon from Cloudinary
    if (category.icon?.public_id) {
      await deleteFromCloudinary(category.icon.public_id);
    }

    // 4️⃣ Delete category
    await NewCategory.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      deletedId: id,
    });
  } catch (err) {
    console.error("Delete Category Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const buildTree = (categories, parentId = null) => {
  const tree = [];

  categories.forEach((cat) => {
    if (
      (parentId === null && cat.parent === null) ||
      (cat.parent && cat.parent.toString() === parentId?.toString())
    ) {
      tree.push({
        _id: cat._id,
        name: cat.name,
        slug: cat.slug,
        parent: cat.parent,
        icon: cat.icon,
        banner: cat.banner,
        description: cat.description,
        isActive: cat.isActive,
        isFeatured: cat.isFeatured,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
        children: buildTree(categories, cat._id),
      });
    }
  });

  return tree;
};
const getCategoryTree = async (req, res) => {
  try {
    // 1. Fetch all categories at once
    const categories = await NewCategory.find().lean();

    // 2. HashMap for O(1) lookup
    const categoryMap = {};
    const roots = [];

    categories.forEach((cat) => {
      categoryMap[cat._id] = { ...cat, children: [] };
    });

    // 3. Build the tree
    categories.forEach((cat) => {
      if (cat.parent) {
        categoryMap[cat.parent]?.children.push(categoryMap[cat._id]);
      } else {
        roots.push(categoryMap[cat._id]);
      }
    });

    // 4. Respond
    res.status(200).json({
      success: true,
      tree: roots,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createCategory,
  bulkUploadCategories,
  getAllCategories,
  getSingleCategory,
  updateCategoryFields,
  updateBanner,
  updateIcon,
  deleteCategory,
  getCategoryTree,
};
