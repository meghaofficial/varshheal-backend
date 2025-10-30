const { createAddress, updateAddress, getAllAddresses } = require("../controller/addressController");
const { isAuthenticated, requireAuth } = require("../middleware/authMiddleware");

const router = require("express").Router();

router.post("/create-address", isAuthenticated, createAddress);
router.patch("/update-address", isAuthenticated, updateAddress);
router.get("/all-address", isAuthenticated, getAllAddresses);

module.exports = router;