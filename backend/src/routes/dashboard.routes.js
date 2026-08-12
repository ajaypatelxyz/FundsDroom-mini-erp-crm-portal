const express = require("express");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const SalesChallan = require("../models/SalesChallan");
const StockMovement = require("../models/StockMovement");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// GET /api/dashboard — overview stats
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const [totalCustomers, activeCustomers, leadCustomers] = await Promise.all([
      Customer.countDocuments(),
      Customer.countDocuments({ status: "Active" }),
      Customer.countDocuments({ status: "Lead" }),
    ]);

    const [totalProducts, lowStockProducts] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ $expr: { $lte: ["$currentStock", "$minStockAlert"] } }),
    ]);

    const [totalChallans, draftChallans, confirmedChallans] = await Promise.all([
      SalesChallan.countDocuments(),
      SalesChallan.countDocuments({ status: "Draft" }),
      SalesChallan.countDocuments({ status: "Confirmed" }),
    ]);

    // Total revenue from confirmed challans
    const revenueAgg = await SalesChallan.aggregate([
      { $match: { status: "Confirmed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    // Low stock items list
    const lowStockItems = await Product.find({ $expr: { $lte: ["$currentStock", "$minStockAlert"] } })
      .select("name sku currentStock minStockAlert category")
      .sort({ currentStock: 1 })
      .limit(10);

    // Recent stock movements
    const recentMovements = await StockMovement.find()
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent challans
    const recentChallans = await SalesChallan.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("challanNumber customerSnapshot.name totalAmount status createdAt");

    return res.json({
      success: true,
      stats: {
        customers: { total: totalCustomers, active: activeCustomers, leads: leadCustomers },
        products: { total: totalProducts, lowStock: lowStockProducts },
        challans: { total: totalChallans, draft: draftChallans, confirmed: confirmedChallans },
        totalRevenue,
      },
      lowStockItems,
      recentMovements,
      recentChallans,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
