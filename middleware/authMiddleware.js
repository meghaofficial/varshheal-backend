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
  const auth = req.headers["authorization"];
  if (!auth) {
    return res.status(403).json({
      message: "Unauthorized, JWT token required",
    });
  }
  try {
    const decode = jwt.verify(auth, process.env.JWT_SECRET);
    req.user = decode;
    next();
  } catch (error) {
    return res.status(403).json({
      message: "Unauthorized, JWT token wrong or expired",
      error,
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
