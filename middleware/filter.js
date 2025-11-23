const { productFilter } = require("../utilities/helper");

const filterMiddleware = (req, res, next) => {
  try {
    req.filterQuery = productFilter({
      categoryId: req.query.categoryId,
      priceMin: req.query.priceMin,
      priceMax: req.query.priceMax,
      ratingMin: req.query.ratingMin,
      ratingMax: req.query.ratingMax,
      color: req.query['color[]'], // array or single
      search: req.query.search,
    });
    
    next();
  } catch (error) {
    console.log("Filter error:", error);
    return res.status(400).json({
      success: false,
      message: "Invalid filter parameters",
      error: error.message,
    });
  }
};

module.exports = { filterMiddleware };
