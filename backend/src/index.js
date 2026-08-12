require("dotenv").config();

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

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    time: new Date().toISOString()
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/stock-movements", stockMovementRoutes);
app.use("/api/challans", challanRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Global error handler
app.use(errorHandler);

// Database initialization
let dbPromise = null;

const initializeDB = async () => {
  if (!dbPromise) {
    dbPromise = (async () => {
      await connectDB();

      const User = require("./models/User");
      const userCount = await User.countDocuments();

      if (userCount === 0) {
        console.log("[Server] No users found - auto-seeding demo data...");
        await seedDatabase();
      }

      console.log("[Server] Database initialized successfully.");
    })();
  }

  return dbPromise;
};

// Vercel / Node serverless handler
module.exports = async (req, res) => {
  try {
    await initializeDB();
    return app(req, res);
  } catch (error) {
    console.error("[Server] Database initialization failed:", error);

    return res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : error.message
    });
  }
};

// Local development
if (require.main === module) {
  initializeDB()
    .then(() => {
      const PORT = process.env.PORT || 5000;

      app.listen(PORT, () => {
        console.log(
          `🚀 Backend running at http://localhost:${PORT}`
        );
      });
    })
    .catch((error) => {
      console.error("Failed to start server:", error);
      process.exit(1);
    });
}