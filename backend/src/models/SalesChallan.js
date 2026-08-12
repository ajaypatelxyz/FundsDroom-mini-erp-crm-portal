const mongoose = require("mongoose");

const challanItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const customerSnapshotSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    name: { type: String, required: true },
    businessName: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    gstNumber: { type: String, default: "" },
  },
  { _id: false }
);

const salesChallanSchema = new mongoose.Schema(
  {
    challanNumber: { type: String, required: true, unique: true },
    customerSnapshot: { type: customerSnapshotSchema, required: true },
    items: { type: [challanItemSchema], required: true },
    totalQuantity: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["Draft", "Confirmed", "Cancelled"],
      required: true,
      default: "Draft",
    },
    notes: { type: String, default: "" },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SalesChallan", salesChallanSchema);
