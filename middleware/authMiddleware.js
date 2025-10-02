const jwt = require("jsonwebtoken");

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

module.exports = requireAuth;
