const errorHandler = (err, req, res, next) => {
  console.error("[Error]:", err.message || err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({ success: false, message: err.message });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return res.status(400).json({ success: false, message: `Duplicate entry: '${field}' already exists.` });
  }

  // Mongoose CastError (bad ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({ success: false, message: `Invalid ID format: ${err.value}` });
  }

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

module.exports = errorHandler;
