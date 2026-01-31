const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
  sendMessageToStudents,
  sendZoomLink,
  getStudentMessages,
  sendMessageToTeacher,
  getTeacherMessages,
  markMessageAsRead,
  getZoomLink
} = require("../controllers/messageController");

// Teacher routes
router.post("/teacher/send", authMiddleware, sendMessageToStudents);
router.post("/teacher/zoom-link", authMiddleware, sendZoomLink);
router.get("/teacher/messages", authMiddleware, getTeacherMessages);

// Student routes
router.get("/student/messages", authMiddleware, getStudentMessages);
router.post("/student/send", authMiddleware, sendMessageToTeacher);

// Common routes
router.put("/:messageId/read", authMiddleware, markMessageAsRead);
router.get("/zoom-link/:courseId", getZoomLink);

module.exports = router;

