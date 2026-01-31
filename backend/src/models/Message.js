const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ["info", "zoom_link", "announcement", "reminder", "student_message"],
    default: "info"
  },
  direction: {
    type: String,
    enum: ["teacher_to_student", "student_to_teacher"],
    required: true
  },
  zoomLink: {
    type: String,
    default: null
  },
  meetingId: {
    type: String,
    default: null
  },
  password: {
    type: String,
    default: null
  },
  meetingDate: {
    type: Date,
    default: null
  },
  meetingTime: {
    type: String,
    default: null
  },
  read: {
    type: Boolean,
    default: false
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
    default: null
  }
}, { timestamps: true });

// =====================================================
// PERFORMANCE INDEXES
// =====================================================

// Index for getting student messages (very common query)
messageSchema.index({ studentId: 1, createdAt: -1 });

// Index for getting teacher messages (very common query)
messageSchema.index({ teacherId: 1, createdAt: -1 });

// Index for courseId queries
messageSchema.index({ courseId: 1 });

// Compound index for teacher-student conversations
messageSchema.index({ teacherId: 1, studentId: 1, createdAt: -1 });

// Index for unread messages
messageSchema.index({ read: 1 });

module.exports = mongoose.model("Message", messageSchema);
