const paginate = (model, baseQuery = {}) => async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : "";

    // let query = { ...baseQuery };
    let query = { ...baseQuery, ...(req.filterQuery || {}) };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { id: { $regex: search, $options: "i" } },
      ];
    }

    const total = await model.countDocuments(query);
    const data = await model.find(query).skip(skip).limit(limit).sort({ createdAt: -1, _id: -1 });

    res.paginationResult = {
      success: true,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      data,
    };
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: "Pagination failed", error: error.message });
  }
};

module.exports = paginate;