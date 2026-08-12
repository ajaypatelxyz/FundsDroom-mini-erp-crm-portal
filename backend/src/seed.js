const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Customer = require("./models/Customer");
const Product = require("./models/Product");
const StockMovement = require("./models/StockMovement");
const SalesChallan = require("./models/SalesChallan");

const seedDatabase = async () => {
  console.log("[Seed] Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Customer.deleteMany({}),
    Product.deleteMany({}),
    StockMovement.deleteMany({}),
    SalesChallan.deleteMany({}),
  ]);

  // --- USERS ---
  const hash = await bcrypt.hash("password123", 10);
  const users = await User.insertMany([
    { name: "Admin User", email: "admin@erp.com", passwordHash: hash, role: "ADMIN" },
    { name: "Rahul Sales", email: "sales@erp.com", passwordHash: hash, role: "SALES" },
    { name: "Priya Warehouse", email: "warehouse@erp.com", passwordHash: hash, role: "WAREHOUSE" },
    { name: "Amit Accounts", email: "accounts@erp.com", passwordHash: hash, role: "ACCOUNTS" },
  ]);
  console.log(`[Seed] ${users.length} users created`);

  // --- CUSTOMERS ---
  const customers = await Customer.insertMany([
    {
      name: "Rajesh Sharma", mobile: "9876543210", email: "rajesh@sharma.co",
      businessName: "Sharma Traders", gstNumber: "29ABCDE1234F1Z5",
      customerType: "Wholesale", address: "MG Road, Bangalore", status: "Active",
      followUpDate: new Date("2026-08-20"),
      followUpNotes: [{ note: "Interested in bulk cement order", createdBy: "Rahul Sales", createdAt: new Date() }],
    },
    {
      name: "Priya Patel", mobile: "9123456789", email: "priya@patelenterprises.in",
      businessName: "Patel Enterprises", gstNumber: "24XYZAB5678C2Q1",
      customerType: "Distributor", address: "Ring Road, Ahmedabad", status: "Active",
      followUpNotes: [{ note: "Renewal due next quarter", createdBy: "Admin User", createdAt: new Date() }],
    },
    {
      name: "Suresh Reddy", mobile: "9988776655", email: "suresh.reddy@gmail.com",
      businessName: "Reddy Hardware", customerType: "Retail",
      address: "Jubilee Hills, Hyderabad", status: "Lead",
      followUpDate: new Date("2026-08-25"),
    },
    {
      name: "Anita Desai", mobile: "8877665544", email: "anita@desaidistributors.com",
      businessName: "Desai Distributors", gstNumber: "27PQRST9012U3V4",
      customerType: "Wholesale", address: "FC Road, Pune", status: "Active",
    },
    {
      name: "Vikram Singh", mobile: "7766554433", email: "vikram@singhsupply.in",
      businessName: "Singh Supply Co.", customerType: "Wholesale",
      address: "Connaught Place, Delhi", status: "Inactive",
    },
  ]);
  console.log(`[Seed] ${customers.length} customers created`);

  // --- PRODUCTS ---
  const products = await Product.insertMany([
    { name: "Portland Cement 50kg", sku: "CEM-PORT-50", category: "Cement", unitPrice: 380, currentStock: 200, minStockAlert: 50, location: "Warehouse A - Bay 1" },
    { name: "TMT Steel Bar 12mm", sku: "STL-TMT-12", category: "Steel", unitPrice: 620, currentStock: 150, minStockAlert: 30, location: "Warehouse A - Bay 2" },
    { name: "Red Bricks (per 1000)", sku: "BRK-RED-1K", category: "Bricks", unitPrice: 5500, currentStock: 45, minStockAlert: 20, location: "Open Yard - Section C" },
    { name: "Sand Fine (per ton)", sku: "SND-FINE-1T", category: "Aggregates", unitPrice: 1800, currentStock: 80, minStockAlert: 25, location: "Open Yard - Section A" },
    { name: "Paint White 20L", sku: "PNT-WHT-20", category: "Paints", unitPrice: 2400, currentStock: 60, minStockAlert: 15, location: "Warehouse B - Shelf 5" },
    { name: "Electrical Wire 90m", sku: "ELC-WIR-90", category: "Electrical", unitPrice: 1250, currentStock: 8, minStockAlert: 10, location: "Warehouse B - Shelf 8" },
    { name: "PVC Pipe 4inch 6ft", sku: "PVC-4IN-6F", category: "Plumbing", unitPrice: 280, currentStock: 120, minStockAlert: 40, location: "Warehouse A - Bay 4" },
    { name: "Gravel Coarse (per ton)", sku: "GRV-CRS-1T", category: "Aggregates", unitPrice: 1500, currentStock: 5, minStockAlert: 15, location: "Open Yard - Section B" },
  ]);
  console.log(`[Seed] ${products.length} products created`);

  // --- STOCK MOVEMENTS ---
  const movements = [];
  for (const p of products) {
    movements.push({
      productId: p._id, productName: p.name, sku: p.sku,
      quantity: p.currentStock, movementType: "IN",
      reason: "Initial stock entry", createdBy: "Priya Warehouse",
    });
  }
  await StockMovement.insertMany(movements);
  console.log(`[Seed] ${movements.length} stock movement entries created`);

  // --- SALES CHALLANS ---
  const challan1 = await SalesChallan.create({
    challanNumber: "SCH-202608-0001",
    customerSnapshot: {
      customerId: customers[0]._id, name: customers[0].name,
      businessName: customers[0].businessName, mobile: customers[0].mobile,
      email: customers[0].email, address: customers[0].address, gstNumber: customers[0].gstNumber,
    },
    items: [
      { productId: products[0]._id, productName: products[0].name, sku: products[0].sku, unitPrice: products[0].unitPrice, quantity: 20, totalPrice: products[0].unitPrice * 20 },
      { productId: products[1]._id, productName: products[1].name, sku: products[1].sku, unitPrice: products[1].unitPrice, quantity: 10, totalPrice: products[1].unitPrice * 10 },
    ],
    totalQuantity: 30,
    totalAmount: products[0].unitPrice * 20 + products[1].unitPrice * 10,
    status: "Confirmed",
    createdBy: "Rahul Sales",
  });

  const challan2 = await SalesChallan.create({
    challanNumber: "SCH-202608-0002",
    customerSnapshot: {
      customerId: customers[1]._id, name: customers[1].name,
      businessName: customers[1].businessName, mobile: customers[1].mobile,
      email: customers[1].email, address: customers[1].address, gstNumber: customers[1].gstNumber,
    },
    items: [
      { productId: products[4]._id, productName: products[4].name, sku: products[4].sku, unitPrice: products[4].unitPrice, quantity: 5, totalPrice: products[4].unitPrice * 5 },
    ],
    totalQuantity: 5,
    totalAmount: products[4].unitPrice * 5,
    status: "Draft",
    createdBy: "Rahul Sales",
  });

  console.log("[Seed] 2 sales challans created");
  console.log("[Seed] ✅ Database seeded successfully!");
  console.log("[Seed] Login credentials (all passwords: password123):");
  console.log("  Admin:     admin@erp.com");
  console.log("  Sales:     sales@erp.com");
  console.log("  Warehouse: warehouse@erp.com");
  console.log("  Accounts:  accounts@erp.com");
};

module.exports = { seedDatabase };
