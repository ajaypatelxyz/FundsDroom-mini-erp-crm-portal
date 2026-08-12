const express = require("express");
const Customer = require("../models/Customer");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /api/customers — list with pagination, search, filters
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status;
    const customerType = req.query.customerType;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { businessName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ];
    }
    if (status && status !== "ALL") query.status = status;
    if (customerType && customerType !== "ALL") query.customerType = customerType;

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({ success: true, data: customers, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
});

// GET /api/customers/all — all customers (for dropdowns)
router.get("/all", authenticateToken, async (req, res, next) => {
  try {
    const customers = await Customer.find({ status: { $ne: "Inactive" } })
      .select("name businessName mobile email address gstNumber")
      .sort({ name: 1 });
    return res.json({ success: true, data: customers });
  } catch (err) {
    next(err);
  }
});

// GET /api/customers/:id
router.get("/:id", authenticateToken, async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });
    return res.json({ success: true, customer });
  } catch (err) {
    next(err);
  }
});

// POST /api/customers — create (Admin, Sales)
router.post("/", authenticateToken, requireRole(["ADMIN", "SALES"]), async (req, res, next) => {
  try {
    const { name, mobile, email, businessName, gstNumber, customerType, address, status, followUpDate, notes } = req.body;
    if (!name || !mobile || !email || !businessName || !address) {
      return res.status(400).json({ success: false, message: "Missing required fields: name, mobile, email, businessName, address" });
    }

    const customer = await Customer.create({
      name, mobile, email, businessName,
      gstNumber: gstNumber || "",
      customerType: customerType || "Wholesale",
      address,
      status: status || "Lead",
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      notes: notes || "",
      followUpNotes: notes ? [{ note: notes, createdBy: req.user.name, createdAt: new Date() }] : [],
    });

    return res.status(201).json({ success: true, message: "Customer created", customer });
  } catch (err) {
    next(err);
  }
});

// PUT /api/customers/:id — edit (Admin, Sales)
router.put("/:id", authenticateToken, requireRole(["ADMIN", "SALES"]), async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

    const fields = ["name", "mobile", "email", "businessName", "gstNumber", "customerType", "address", "status", "notes"];
    fields.forEach((f) => { if (req.body[f] !== undefined) customer[f] = req.body[f]; });
    if (req.body.followUpDate) customer.followUpDate = new Date(req.body.followUpDate);

    await customer.save();
    return res.json({ success: true, message: "Customer updated", customer });
  } catch (err) {
    next(err);
  }
});

// POST /api/customers/:id/notes — add follow-up note (Admin, Sales, Accounts)
router.post("/:id/notes", authenticateToken, requireRole(["ADMIN", "SALES", "ACCOUNTS"]), async (req, res, next) => {
  try {
    const { note } = req.body;
    if (!note) return res.status(400).json({ success: false, message: "Note content is required" });

    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

    customer.followUpNotes.unshift({ note, createdBy: req.user.name, createdAt: new Date() });
    await customer.save();

    return res.json({ success: true, message: "Note added", followUpNotes: customer.followUpNotes });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
