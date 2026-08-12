const jwt = require("jsonwebtoken");

// Verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Access denied. No token provided." });
  }

  try {
    const secret = process.env.JWT_SECRET || "super_secret_jwt_key_minierp_2026";
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: "Invalid or expired token." });
  }
};

// Role guard — ADMIN always passes
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthenticated." });
    }
    if (req.user.role === "ADMIN" || allowedRoles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: `Forbidden. Role '${req.user.role}' lacks access. Required: ${allowedRoles.join(", ")}`,
    });
  };
};

module.exports = { authenticateToken, requireRole };
