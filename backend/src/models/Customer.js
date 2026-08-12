const mongoose = require("mongoose");

const followUpNoteSchema = new mongoose.Schema(
  {
    note: { type: String, required: true, trim: true },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    businessName: { type: String, required: true, trim: true },
    gstNumber: { type: String, trim: true, default: "" },
    customerType: {
      type: String,
      enum: ["Retail", "Wholesale", "Distributor"],
      required: true,
      default: "Wholesale",
    },
    address: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["Lead", "Active", "Inactive"],
      required: true,
      default: "Lead",
    },
    followUpDate: { type: Date },
    notes: { type: String, default: "" },
    followUpNotes: [followUpNoteSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);
