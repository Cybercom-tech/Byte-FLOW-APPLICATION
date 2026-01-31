const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { createStudentProfile, getStudentDashboard, enrollInCourse, getMyEnrollments, updateProgress } = require("../controllers/studentController");
const { getAllCourses } = require("../controllers/courseController");

router.post("/profile", authMiddleware, createStudentProfile); // Students profile data 

// Student dashboard
router.get("/student-dashboard", authMiddleware, getStudentDashboard);

// Show all courses
router.get("/courses", authMiddleware, getAllCourses);

// Enroll in a course
router.post("/enroll", authMiddleware, enrollInCourse);

// Get my enrollments
router.get("/enrollments", authMiddleware, getMyEnrollments);

// Update course progress
router.put("/enrollments/:enrollmentId/progress", authMiddleware, updateProgress);

module.exports = router;
