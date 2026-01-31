const mongoose = require("mongoose");

// User model
const userSchema = new mongoose.Schema({
    name : {
        type : String, 
        required : true
    },
    email : {
        type : String, 
        required : true,
        unique : true
    },
    password : {
        type : String, 
        required : true,
    },
    userType : {
        type : String, 
        required : true,
        enum : ["student", "teacher", "admin"],
        default : "student"
    }
});

// =====================================================
// PERFORMANCE INDEXES
// =====================================================

// Index for userType queries (finding all admins, teachers, etc.)
userSchema.index({ userType: 1 });

// Compound index for userType + createdAt (admin user listing)
userSchema.index({ userType: 1, createdAt: -1 });

// Note: email already has unique: true which creates an index

module.exports = mongoose.model("User", userSchema);
