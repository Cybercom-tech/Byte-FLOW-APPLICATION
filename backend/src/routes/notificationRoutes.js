
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
  broadcastNotification,
  getMyNotifications,
  markAsRead,
  deleteNotification
} = require("../controllers/notificationController");

// Teacher broadcast
router.post("/broadcast", authMiddleware, broadcastNotification);  // message braodcasted by teacher will be sent here

// Student get notifications
router.get("/mynotification", authMiddleware, getMyNotifications); 

// Mark as read
router.put("/:notificationId/read", authMiddleware, markAsRead); //this text (/:notificationId) means the ID of the notification also called Primary key, atuomaticly generated at database 

// Delete notification
router.delete("/:notificationId", authMiddleware, deleteNotification);

module.exports = router;
