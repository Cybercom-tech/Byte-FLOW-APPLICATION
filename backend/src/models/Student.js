const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true // This creates an index
  },

  profileImage:{
    type: String,
    default : false,
    require: false
  },

  // ACCOUNT STATUS
  isAccountBlocked: {
    type: Boolean,
    default: false
  }

});

// Note: userId already has unique: true which creates an index
// No additional indexes needed

module.exports = mongoose.model("Student", studentSchema);
