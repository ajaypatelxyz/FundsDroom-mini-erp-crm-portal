const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { authenticateToken } = require("../middleware/auth");
const { seedDatabase } = require("../seed");

const router = express.Router();

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const secret = process.env.JWT_SECRET || "super_secret_jwt_key_minierp_2026";
    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role },
      secret,
      { expiresIn: "24h" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get("/me", authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/seed — reseed database
router.post("/seed", async (req, res, next) => {
  try {
    await seedDatabase();
    return res.json({ success: true, message: "Database seeded with demo data!" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
