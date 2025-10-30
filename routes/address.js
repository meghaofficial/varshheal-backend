const { createAddress, updateAddress, getAllAddresses, deleteAddress } = require("../controller/addressController");
const { isAuthenticated, requireAuth } = require("../middleware/authMiddleware");

const router = require("express").Router();

router.post("/create-address", isAuthenticated, createAddress);
router.patch("/update-address/:id", isAuthenticated, updateAddress);
router.get("/all-address", isAuthenticated, getAllAddresses);
router.delete("/delete-address/:id", isAuthenticated, deleteAddress);

module.exports = router;