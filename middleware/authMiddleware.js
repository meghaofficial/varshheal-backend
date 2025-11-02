const jwt = require("jsonwebtoken");
const User = require("../models/User");

const requireAuth = (req, res, next) => {
  const tokenFromHeader = req.headers.authorization;
  let token = req.cookies?.token;

  if (!token && tokenFromHeader && tokenFromHeader.startsWith("Bearer ")) {
    token = tokenFromHeader.split(" ")[1];
  }
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const isAuthenticated = (req, res, next) => {
  try {
    // Try to get token from cookie or header
    let token = req.cookies?.token;
    const authHeader = req.headers.authorization;

    // If token not in cookie, check Authorization header
    if (!token && authHeader) {
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1]; 
      } else {
        token = authHeader; 
      }
    }

    if (!token) {
      return res.status(403).json({
        message: "Unauthorized, JWT token required",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = decoded;

    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(403).json({
      message: "Unauthorized, JWT token invalid or expired",
    });
  }
};


const isAuthorized = async (req, res, next) => {
  try {
    const { email } = req.user;
    const fullDetail = await User.findOne({ email });
    const isAdmin = fullDetail.role === 1001;
    if (!isAdmin) {
      return res.status(403).json({
        message: "Unauthorized access",
      });
    }
    return next();
  } catch (error) {
    console.log(error);
    return res.status(403).json({
      message: "Unauthorized access",
    });
  }
};

module.exports = {
  requireAuth,
  isAuthenticated,
  isAuthorized
};
