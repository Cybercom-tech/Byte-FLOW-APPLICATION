const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // The user to receive the NOTIFICATION
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // User generating the Notification, for broadcasting message
    // For now is teacher only
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true
    },
    // type of message 
    type: {
      type: String,
      enum: ["General", "Announcement", "Reminder", "payment_approved", "payment_rejected", "student_assigned", "course_approved", "new_payment", "course_submitted", "course_completed", "certificate_required"],
      required: true
    },

    // the actual message 
    message: {
      type: String,
      required: true
    },
    // Additional data for the notification (courseId, courseTitle, etc.)
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    // data when the message read by the user/ student
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// =====================================================
// PERFORMANCE INDEXES
// =====================================================

// Index for getting user's notifications (most common query)
notificationSchema.index({ receiverId: 1, createdAt: -1 });

// Index for unread notifications
notificationSchema.index({ receiverId: 1, isRead: 1 });

// Index for notification type filtering
notificationSchema.index({ type: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
