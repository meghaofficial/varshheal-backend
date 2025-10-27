const router = require("express").Router();
const { signupWithGoogle, logout, signup, signin, verifyEmail, getDetails } = require("../controller/authController");
const { isAuthenticated } = require("../middleware/authMiddleware");
require("dotenv").config();

router.post("/google", signupWithGoogle);
router.post("/logout", logout);
router.post("/signup", signup);
router.post("/signin", signin);
router.post("/signup/verify", verifyEmail);
router.get("/user/details", isAuthenticated, getDetails);

module.exports = router;
