const express = require("express");
const StockMovement = require("../models/StockMovement");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// GET /api/stock-movements — audit log with filters
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const movementType = req.query.movementType;
    const productId = req.query.productId;

    const query = {};
    if (movementType && ["IN", "OUT"].includes(movementType)) query.movementType = movementType;
    if (productId) query.productId = productId;

    const total = await StockMovement.countDocuments(query);
    const data = await StockMovement.find(query)
      .populate("productId", "name sku category")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
