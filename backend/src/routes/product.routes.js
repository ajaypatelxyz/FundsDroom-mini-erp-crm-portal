const express = require("express");
const Product = require("../models/Product");
const StockMovement = require("../models/StockMovement");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /api/products — list with pagination, search, category, low-stock filter
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const category = req.query.category;
    const lowStock = req.query.lowStock === "true";

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }
    if (category && category !== "ALL") query.category = category;
    if (lowStock) query.$expr = { $lte: ["$currentStock", "$minStockAlert"] };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({ success: true, data: products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/categories — distinct categories
router.get("/categories", authenticateToken, async (req, res, next) => {
  try {
    const categories = await Product.distinct("category");
    return res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/all — all products for dropdowns
router.get("/all", authenticateToken, async (req, res, next) => {
  try {
    const products = await Product.find().select("name sku unitPrice currentStock category").sort({ name: 1 });
    return res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id
router.get("/:id", authenticateToken, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    return res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
});

// POST /api/products — create (Admin, Warehouse)
router.post("/", authenticateToken, requireRole(["ADMIN", "WAREHOUSE"]), async (req, res, next) => {
  try {
    const { name, sku, category, unitPrice, currentStock, minStockAlert, location, imageUrl } = req.body;
    if (!name || !sku || !category || unitPrice === undefined) {
      return res.status(400).json({ success: false, message: "name, sku, category, unitPrice are required" });
    }

    const product = await Product.create({
      name, sku: sku.toUpperCase(), category,
      unitPrice: Number(unitPrice),
      currentStock: Number(currentStock) || 0,
      minStockAlert: Number(minStockAlert) || 10,
      location: location || "Warehouse A",
      imageUrl: imageUrl || "",
    });

    if (product.currentStock > 0) {
      await StockMovement.create({
        productId: product._id, productName: product.name, sku: product.sku,
        quantity: product.currentStock, movementType: "IN",
        reason: "Initial stock entry", createdBy: req.user.name,
      });
    }

    return res.status(201).json({ success: true, message: "Product added", product });
  } catch (err) {
    next(err);
  }
});

// PUT /api/products/:id — edit (Admin, Warehouse)
router.put("/:id", authenticateToken, requireRole(["ADMIN", "WAREHOUSE"]), async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const fields = ["name", "category", "unitPrice", "minStockAlert", "location", "imageUrl"];
    fields.forEach((f) => { if (req.body[f] !== undefined) product[f] = req.body[f]; });

    if (req.body.sku && req.body.sku.toUpperCase() !== product.sku) {
      const exists = await Product.findOne({ sku: req.body.sku.toUpperCase() });
      if (exists) return res.status(400).json({ success: false, message: `SKU '${req.body.sku.toUpperCase()}' already in use.` });
      product.sku = req.body.sku.toUpperCase();
    }

    await product.save();
    return res.json({ success: true, message: "Product updated", product });
  } catch (err) {
    next(err);
  }
});

// POST /api/products/:id/adjust-stock — manual IN/OUT (Admin, Warehouse)
router.post("/:id/adjust-stock", authenticateToken, requireRole(["ADMIN", "WAREHOUSE"]), async (req, res, next) => {
  try {
    const { quantity, movementType, reason } = req.body;
    if (!quantity || !movementType || !reason) {
      return res.status(400).json({ success: false, message: "quantity, movementType, reason are required" });
    }
    if (!["IN", "OUT"].includes(movementType)) {
      return res.status(400).json({ success: false, message: "movementType must be 'IN' or 'OUT'" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const qty = Number(quantity);
    if (qty < 1) return res.status(400).json({ success: false, message: "Quantity must be at least 1" });

    if (movementType === "OUT" && product.currentStock < qty) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for '${product.name}' (SKU: ${product.sku}). Available: ${product.currentStock}, Requested: ${qty}`,
      });
    }

    product.currentStock += movementType === "IN" ? qty : -qty;
    await product.save();

    const log = await StockMovement.create({
      productId: product._id, productName: product.name, sku: product.sku,
      quantity: qty, movementType, reason, createdBy: req.user.name,
    });

    return res.json({ success: true, message: `Stock adjusted (${movementType} ${qty})`, currentStock: product.currentStock, log });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
