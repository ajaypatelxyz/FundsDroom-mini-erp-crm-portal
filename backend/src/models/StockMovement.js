const mongoose = require("mongoose");

const stockMovementSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    movementType: { type: String, enum: ["IN", "OUT"], required: true },
    reason: { type: String, required: true, trim: true },
    createdBy: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("StockMovement", stockMovementSchema);
