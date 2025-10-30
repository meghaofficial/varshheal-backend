const express = require('express');
const { requireAuth, isAuthenticated } = require('../middleware/authMiddleware');

const router = express.Router();

router.get("/me", isAuthenticated, (req, res) => {
      res.json({ user: req.user });
});


module.exports = router;