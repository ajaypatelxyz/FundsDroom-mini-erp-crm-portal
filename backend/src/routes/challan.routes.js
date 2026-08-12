const express = require("express");
const SalesChallan = require("../models/SalesChallan");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const StockMovement = require("../models/StockMovement");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// Generate unique challan number
const generateChallanNumber = async () => {
  const d = new Date();
  const prefix = `SCH-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  const count = await SalesChallan.countDocuments({ challanNumber: { $regex: `^${prefix}` } });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
};

// GET /api/challans — list
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status;

    const query = {};
    if (search) {
      query.$or = [
        { challanNumber: { $regex: search, $options: "i" } },
        { "customerSnapshot.name": { $regex: search, $options: "i" } },
        { "customerSnapshot.businessName": { $regex: search, $options: "i" } },
      ];
    }
    if (status && status !== "ALL") query.status = status;

    const total = await SalesChallan.countDocuments(query);
    const data = await SalesChallan.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
});

// GET /api/challans/:id — detail
router.get("/:id", authenticateToken, async (req, res, next) => {
  try {
    const challan = await SalesChallan.findById(req.params.id);
    if (!challan) return res.status(404).json({ success: false, message: "Challan not found" });
    return res.json({ success: true, challan });
  } catch (err) {
    next(err);
  }
});

// POST /api/challans — create challan (Draft or Confirmed)
router.post("/", authenticateToken, requireRole(["ADMIN", "SALES"]), async (req, res, next) => {
  try {
    const { customerId, items, status = "Draft", notes } = req.body;
    if (!customerId || !items || !items.length) {
      return res.status(400).json({ success: false, message: "customerId and at least one item are required" });
    }

    // Fetch customer
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

    const customerSnapshot = {
      customerId: customer._id,
      name: customer.name,
      businessName: customer.businessName,
      mobile: customer.mobile,
      email: customer.email,
      address: customer.address,
      gstNumber: customer.gstNumber || "",
    };

    // Fetch all products
    const productIds = items.map((i) => i.productId);
    const dbProducts = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(dbProducts.map((p) => [p._id.toString(), p]));

    const challanItems = [];
    let totalQuantity = 0;
    let totalAmount = 0;
    const insufficientItems = [];

    for (const item of items) {
      const p = productMap.get(item.productId);
      if (!p) return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });

      const qty = Number(item.quantity);
      if (status === "Confirmed" && p.currentStock < qty) {
        insufficientItems.push(`"${p.name}" (SKU: ${p.sku}) — Available: ${p.currentStock}, Requested: ${qty}`);
      }

      const itemTotal = p.unitPrice * qty;
      totalQuantity += qty;
      totalAmount += itemTotal;
      challanItems.push({
        productId: p._id, productName: p.name, sku: p.sku,
        unitPrice: p.unitPrice, quantity: qty, totalPrice: itemTotal,
      });
    }

    if (status === "Confirmed" && insufficientItems.length > 0) {
      return res.status(400).json({ success: false, message: "Insufficient stock", errors: insufficientItems });
    }

    const challanNumber = await generateChallanNumber();

    // If Confirmed, deduct stock immediately
    if (status === "Confirmed") {
      for (const item of items) {
        const p = productMap.get(item.productId);
        p.currentStock -= Number(item.quantity);
        await p.save();
        await StockMovement.create({
          productId: p._id, productName: p.name, sku: p.sku,
          quantity: Number(item.quantity), movementType: "OUT",
          reason: `Sales Challan ${challanNumber} Confirmed`, createdBy: req.user.name,
        });
      }
    }

    const challan = await SalesChallan.create({
      challanNumber, customerSnapshot, items: challanItems,
      totalQuantity, totalAmount, status, notes: notes || "",
      createdBy: req.user.name,
    });

    return res.status(201).json({ success: true, message: `Challan created (${status})`, challan });
  } catch (err) {
    next(err);
  }
});

// PUT /api/challans/:id/status — confirm or cancel
router.put("/:id/status", authenticateToken, requireRole(["ADMIN", "SALES"]), async (req, res, next) => {
  try {
    const { status: targetStatus } = req.body;
    if (!["Confirmed", "Cancelled"].includes(targetStatus)) {
      return res.status(400).json({ success: false, message: "Status must be 'Confirmed' or 'Cancelled'" });
    }

    const challan = await SalesChallan.findById(req.params.id);
    if (!challan) return res.status(404).json({ success: false, message: "Challan not found" });
    if (challan.status === targetStatus) return res.status(400).json({ success: false, message: `Already '${targetStatus}'` });
    if (challan.status === "Cancelled") return res.status(400).json({ success: false, message: "Cannot modify a cancelled challan" });

    // Confirmed → Cancelled: restock
    if (challan.status === "Confirmed" && targetStatus === "Cancelled") {
      for (const item of challan.items) {
        const p = await Product.findById(item.productId);
        if (p) {
          p.currentStock += item.quantity;
          await p.save();
          await StockMovement.create({
            productId: p._id, productName: p.name, sku: p.sku,
            quantity: item.quantity, movementType: "IN",
            reason: `Restock — Challan ${challan.challanNumber} cancelled`, createdBy: req.user.name,
          });
        }
      }
    }

    // Draft → Confirmed: validate stock, deduct
    if (challan.status === "Draft" && targetStatus === "Confirmed") {
      const insufficientItems = [];
      const productMap = new Map();

      for (const item of challan.items) {
        const p = await Product.findById(item.productId);
        if (!p) return res.status(404).json({ success: false, message: `Product '${item.productName}' no longer exists` });
        productMap.set(item.productId.toString(), p);
        if (p.currentStock < item.quantity) {
          insufficientItems.push(`"${p.name}" (SKU: ${p.sku}) — Available: ${p.currentStock}, Needed: ${item.quantity}`);
        }
      }

      if (insufficientItems.length > 0) {
        return res.status(400).json({ success: false, message: "Insufficient stock", errors: insufficientItems });
      }

      for (const item of challan.items) {
        const p = productMap.get(item.productId.toString());
        p.currentStock -= item.quantity;
        await p.save();
        await StockMovement.create({
          productId: p._id, productName: p.name, sku: p.sku,
          quantity: item.quantity, movementType: "OUT",
          reason: `Sales Challan ${challan.challanNumber} Confirmed`, createdBy: req.user.name,
        });
      }
    }

    challan.status = targetStatus;
    await challan.save();
    return res.json({ success: true, message: `Challan ${targetStatus}`, challan });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
