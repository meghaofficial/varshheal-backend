const router = require("express").Router();
const { signupWithGoogle, logout } = require("../controller/authController");
require("dotenv").config();

router.post("/google", signupWithGoogle);
router.post("/logout", logout);

module.exports = router;
