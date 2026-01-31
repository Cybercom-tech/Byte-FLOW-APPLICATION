const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema({
  
  // gets objectId that a student Primary ID Num from Student schema
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  
  // gets objectId that a course Primary ID Num from Courses schema
  // Can be either MongoDB ObjectId (for teacher-created courses) or String (for default courses)
  courseId: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  progress: {
    type: Number, // percentage
    default: 0 
  },

  isCompleted: {
    type: Boolean,
    default: false
  },

  upcomingClassDate: {
    type: Date,
    default: null
  },

  // Enrollment status: 'pending', 'active', 'completed', 'cancelled'
  status: {
    type: String,
    enum: ["pending", "active", "completed", "cancelled"],
    default: "pending"
  },

  // Payment information
  paymentMethod: {
    type: String,
    default: null
  },

  transactionId: {
    type: String,
    default: null
  },

  amountPaid: {
    type: Number,
    default: 0
  },

  // Payment screenshot (base64 string or URL)
  paymentScreenshot: {
    type: String,
    default: null
  },

  // Verification fields
  verificationRequired: {
    type: Boolean,
    default: false
  },

  verifiedAt: {
    type: Date,
    default: null
  },

  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  // Rejection fields
  rejectedAt: {
    type: Date,
    default: null
  },

  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  rejectionReason: {
    type: String,
    default: null
  },

  // Progress tracking
  currentSection: {
    type: String,
    default: null
  },

  completedSections: {
    type: [Number],
    default: []
  },

  lastAccessed: {
    type: Date,
    default: Date.now
  },

  enrolledDate: {
    type: Date,
    default: Date.now
  },

  // Certificate tracking
  certificateSent: {
    type: Boolean,
    default: false
  },

  certificateSentAt: {
    type: Date,
    default: null
  },

  certificateSentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  }
}, { timestamps: true });

// =====================================================
// PERFORMANCE INDEXES - Speed up common queries
// =====================================================

// Index for finding enrollments by student (very common query)
enrollmentSchema.index({ studentId: 1 });

// Index for finding enrollments by course (used in getCourseStudents)
enrollmentSchema.index({ courseId: 1 });

// Index for status filtering (very common)
enrollmentSchema.index({ status: 1 });

// Compound index for course + status (getCourseStudents query)
enrollmentSchema.index({ courseId: 1, status: 1 });

// Compound index for student + course (check existing enrollment)
enrollmentSchema.index({ studentId: 1, courseId: 1 });

// Compound index for student + status (getMyEnrollments)
enrollmentSchema.index({ studentId: 1, status: 1 });

// Index for pending payments query (admin dashboard)
enrollmentSchema.index({ status: 1, verificationRequired: 1 });

// Index for sorting by creation date
enrollmentSchema.index({ createdAt: -1 });

// Index for certificate management queries
enrollmentSchema.index({ isCompleted: 1, certificateSent: 1 });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
