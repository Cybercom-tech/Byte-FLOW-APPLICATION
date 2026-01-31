const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const authMiddleware = require("../middlewares/authMiddleware");

// ✅ PUBLIC ROUTES (no auth required)

// Get all reviews for a teacher (public)
router.get("/teacher/:teacherId", reviewController.getTeacherReviews);

// ✅ PROTECTED ROUTES (auth required)

// Create a review (students only)
router.post("/", authMiddleware, reviewController.createReview);

// Get student's own reviews
router.get("/my-reviews", authMiddleware, reviewController.getMyReviews);

// Check if student can review a specific course
router.get("/can-review/:teacherId/:courseId", authMiddleware, reviewController.canReviewCourse);

// Get completed courses available for review (for a specific teacher)
router.get("/completed-courses/:teacherId", authMiddleware, reviewController.getCompletedCoursesForReview);

// Update a review
router.put("/:reviewId", authMiddleware, reviewController.updateReview);

// Delete a review
router.delete("/:reviewId", authMiddleware, reviewController.deleteReview);

module.exports = router;

