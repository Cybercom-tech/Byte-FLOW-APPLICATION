const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  adminType: {
    type: String,
    enum: ["general", "payment"],
    required: true,
    default: "general"
  },
  permissions: {
    type: [String],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model("Admin", adminSchema);

