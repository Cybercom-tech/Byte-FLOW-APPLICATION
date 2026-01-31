const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getPendingCourses,
  approveCourse,
  rejectCourse,
  getAllUsers,
  toggleUserBlock,
  getPaymentScreenshots,
  verifyPayment,
  rejectPayment,
  getCertificateRequests,
  markCertificateSent
} = require("../controllers/adminController");

// Course moderation routes
router.get("/pending-courses", authMiddleware, getPendingCourses);
router.put("/courses/:courseId/approve", authMiddleware, approveCourse);
router.put("/courses/:courseId/reject", authMiddleware, rejectCourse);

// User management routes
router.get("/users", authMiddleware, getAllUsers);
router.put("/users/:targetUserId/block", authMiddleware, toggleUserBlock);

// Payment management routes
router.get("/payments", authMiddleware, getPaymentScreenshots);
router.put("/enrollments/:enrollmentId/verify-payment", authMiddleware, verifyPayment);
router.put("/enrollments/:enrollmentId/reject-payment", authMiddleware, rejectPayment);

// Certificate management routes
router.get("/certificates", authMiddleware, getCertificateRequests);
router.put("/certificates/:enrollmentId/mark-sent", authMiddleware, markCertificateSent);

module.exports = router;

