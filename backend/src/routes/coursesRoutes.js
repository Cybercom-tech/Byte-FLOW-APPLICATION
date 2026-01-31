const express = require("express");
const router = express.Router();
const authMiddleware =  require("../middlewares/authMiddleware");
const { createCourse, getAllCourses, getCourseById, getTeacherCourses, getCoursesByTeacherId, getTeacherStats, updateCourse, deleteCourse,  
    addReqOfCourse,  learnOutcome,  addContentOfCourse, assignTeacherToCourse, removeTeacherFromCourse, getCourseInstructor, getCoursesAssignmentStatus } = require("../controllers/courseController");

router.post("/create-course", authMiddleware, createCourse);
router.post("/assignment-status", authMiddleware, getCoursesAssignmentStatus);
router.get("/assignment-status", authMiddleware, getCoursesAssignmentStatus);
router.get("/all-courses", getAllCourses);             // all courses (public or with auth)
router.get("/my-courses", authMiddleware, getTeacherCourses);     // teacher's own courses (must be before :courseId)
router.get("/by-teacher/:teacherId", getCoursesByTeacherId);  // get courses by teacher ID (public)
router.get("/teacher-stats/:teacherId", getTeacherStats);  // get teacher stats (student count, etc.) (public)
router.get("/:courseId/instructor", getCourseInstructor);  // get course instructor (public)
router.get("/:courseId", getCourseById);               // get single course
router.put("/:courseId", authMiddleware, updateCourse);    // update course
router.delete("/:courseId", authMiddleware, deleteCourse); // delete course
router.post("/:courseId/requirements", authMiddleware, addReqOfCourse);
// Add Learning Outcome
router.post("/:courseId/learning-outcome", authMiddleware, learnOutcome);
// Add Course Content
router.post("/:courseId/content", authMiddleware, addContentOfCourse);
// Assign/Remove teacher from course
router.post("/:courseId/assign-teacher", authMiddleware, assignTeacherToCourse);
router.delete("/:courseId/assign-teacher", authMiddleware, removeTeacherFromCourse);

module.exports = router;
