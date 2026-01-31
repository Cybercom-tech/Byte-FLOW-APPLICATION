const mongoose = require("mongoose");

// Review Model - For course-specific teacher reviews
const reviewSchema = new mongoose.Schema(
  {
    // The teacher being reviewed
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true
    },
    // The student writing the review
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },
    // The specific course this review is for
    courseId: {
      type: mongoose.Schema.Types.Mixed, // Can be ObjectId or numeric ID for static courses
      required: true
    },
    // Rating (1-5 stars)
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    // Review text
    reviewText: {
      type: String,
      required: true,
      maxlength: 2000
    },
    // Status of the review
    status: {
      type: String,
      enum: ["active", "hidden", "flagged"],
      default: "active"
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt
  }
);

// Compound index to ensure one review per student per course for a teacher
reviewSchema.index({ teacherId: 1, studentId: 1, courseId: 1 }, { unique: true });

// Index for faster queries
reviewSchema.index({ teacherId: 1, status: 1 });
reviewSchema.index({ courseId: 1 });
reviewSchema.index({ studentId: 1 });

module.exports = mongoose.model("Review", reviewSchema);

