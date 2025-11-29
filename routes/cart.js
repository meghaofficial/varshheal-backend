const { getCart, addToCart, updateCart, removeFromCart, clearCart } = require("../controller/cartController");
const { isAuthenticated } = require("../middleware/authMiddleware");

const router = require("express").Router();

router.use(isAuthenticated);

router.get("/cart", getCart);
router.post("/cart/add", addToCart);
router.put("/cart/update", updateCart);
router.delete("/cart/remove", removeFromCart);
router.delete("/cart/clear", clearCart);

module.exports = router;