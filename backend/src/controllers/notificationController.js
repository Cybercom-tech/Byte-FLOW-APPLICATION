const Notification = require("../models/Notification");
const Teacher = require("../models/Teacher");
const Enrollment = require("../models/Enrollment");
const Courses = require("../models/Courses");

// TEACHER → BROADCAST MESSAGE TO STUDENTS - OPTIMIZED
exports.broadcastNotification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type, message } = req.body;

    if (!type || !message) {
      return res.status(400).json({ message: "Type and message required" });
    }

    // Check teacher
    const teacher = await Teacher.findOne({ userId }).lean();
    if (!teacher) {
      return res.status(403).json({ message: "Only teachers allowed" });
    }

    // Get courses taught by this teacher
    const teacherCourses = await Courses.find({ teacherId: teacher._id }).select('_id').lean();
    const courseIds = teacherCourses.map(c => c._id);

    // Get students enrolled in teacher's courses only (not all enrollments!)
    const enrollments = await Enrollment.find({
      courseId: { $in: courseIds },
      status: "active"
    })
      .populate("studentId", "userId")
      .lean();

    // Get unique student user IDs
    const studentUserIds = [...new Set(
      enrollments
        .filter(e => e.studentId && e.studentId.userId)
        .map(e => e.studentId.userId.toString())
    )];

    if (studentUserIds.length === 0) {
      return res.status(200).json({
        message: "No students to notify",
        count: 0
      });
    }

    // Create notifications in batch
    const notifications = studentUserIds.map(studentUserId => ({
      receiverId: studentUserId,
      senderId: teacher._id,
      type,
      message
    }));

    await Notification.insertMany(notifications);

    res.status(201).json({
      message: "Notification broadcasted successfully",
      count: notifications.length
    });

  } catch (error) {
    console.error("BROADCAST ERROR:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// STUDENT → GET MY NOTIFICATIONS - OPTIMIZED with lean()
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    const notifications = await Notification.find({ receiverId: userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ notifications });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// MARK NOTIFICATION AS READ
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, receiverId: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification marked as read" });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// DELETE NOTIFICATION
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      receiverId: userId
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });

  } catch (error) {
    console.error("DELETE NOTIFICATION ERROR:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};
