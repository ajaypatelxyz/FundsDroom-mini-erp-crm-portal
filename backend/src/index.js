require("dotenv").config();

console.log("MONGODB_URI loaded:", !!process.env.MONGODB_URI);

const express = require("express");
const cors = require("cors");

const { connectDB } = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const { seedDatabase } = require("./seed");

// Routes
const authRoutes = require("./routes/auth.routes");
const customerRoutes = require("./routes/customer.routes");
const productRoutes = require("./routes/product.routes");
const stockMovementRoutes = require("./routes/stockMovement.routes");
const challanRoutes = require("./routes/challan.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    time: new Date().toISOString()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/stock-movements", stockMovementRoutes);
app.use("/api/challans", challanRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Global error handler
app.use(errorHandler);

// Database connection
let dbConnected = false;

const initializeDB = async () => {
  if (dbConnected) return;

  await connectDB();

  const User = require("./models/User");
  const userCount = await User.countDocuments();

  if (userCount === 0) {
    console.log("[Server] No users found — auto-seeding demo data...");
    await seedDatabase();
  }

  dbConnected = true;
};

// Vercel handler
module.exports = async (req, res) => {
  await initializeDB();
  return app(req, res);
};

if (require.main === module) {
  initializeDB().then(() => {
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Backend running at http://localhost:${process.env.PORT || 5000}`);
    });
  });
}