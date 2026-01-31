const Enrollment = require("../models/Enrollment");
const Student = require("../models/Student");
const Courses = require("../models/Courses");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendEnrollmentEmail: sendEnrollmentEmailService } = require("../services/emailService");

// VERIFY PAYMENT BY TRANSACTION ID (can be called by frontend or admin)
exports.verifyPaymentByTransaction = async (req, res) => {
  try {
    const { transactionId, expectedAmount, courseId, paymentGateway, bankName } = req.body;

    if (!transactionId || !expectedAmount) {
      return res.status(400).json({ 
        success: false, 
        verified: false,
        message: "Transaction ID and expected amount are required" 
      });
    }

    // In a real implementation, you would call the payment gateway API here
    // For now, this is a placeholder that returns pending status
    // The actual verification would happen via webhook or API call to JazzCash/EasyPaisa

    res.json({
      success: true,
      verified: false,
      status: "pending",
      message: "Payment verification in progress. Please wait for confirmation."
    });
  } catch (error) {
    console.error("VERIFY PAYMENT ERROR:", error);
    res.status(500).json({ 
      success: false, 
      verified: false,
      message: "Server Error" 
    });
  }
};

// GET PAYMENT STATUS (for polling)
exports.getPaymentStatus = async (req, res) => {
  try {
    const { transactionId } = req.query;

    if (!transactionId) {
      return res.status(400).json({ message: "Transaction ID is required" });
    }

    // Find enrollment with this transaction ID
    const enrollment = await Enrollment.findOne({ transactionId })
      .populate("courseId", "courseTitle")
      .populate("studentId", "userId");

    if (!enrollment) {
      return res.status(404).json({ 
        verified: false,
        status: "not_found",
        message: "Transaction not found" 
      });
    }

    res.json({
      verified: enrollment.status === "active",
      status: enrollment.status,
      enrollmentId: enrollment._id,
      courseId: enrollment.courseId._id,
      courseTitle: enrollment.courseId.courseTitle
    });
  } catch (error) {
    console.error("GET PAYMENT STATUS ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// WEBHOOK HANDLER (for payment gateway callbacks)
exports.handlePaymentWebhook = async (req, res) => {
  try {
    const { transactionId, status, amount, paymentGateway } = req.body;

    if (!transactionId || !status) {
      return res.status(400).json({ message: "Invalid webhook data" });
    }

    // Find enrollment by transaction ID
    const enrollment = await Enrollment.findOne({ transactionId })
      .populate("studentId", "userId")
      .populate("courseId", "courseTitle teacherId");

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    // If payment is verified, activate enrollment
    if (status === "completed" || status === "success" || status === "verified") {
      enrollment.status = "active";
      enrollment.verifiedAt = new Date();
      enrollment.progress = 0;
      enrollment.currentSection = "Introduction";
      enrollment.lastAccessed = new Date();
      await enrollment.save();

      // Notify student
      const Teacher = require("../models/Teacher");
      const User = require("../models/User");
      const courseTeacher = await Teacher.findById(enrollment.courseId.teacherId);
      const notification = new Notification({
        receiverId: enrollment.studentId.userId,
        senderId: courseTeacher ? courseTeacher._id : enrollment.courseId.teacherId,
        type: "payment_approved",
        message: `Your payment for "${enrollment.courseId.courseTitle}" has been verified. You now have access to the course!`,
        data: {
          courseId: enrollment.courseId._id,
          courseTitle: enrollment.courseId.courseTitle
        }
      });
      await notification.save();

      // Notify teacher about new student enrollment
      try {
        let teacherUserId = null;
        
        // Get teacher userId from course teacher
        if (courseTeacher && courseTeacher.userId) {
          teacherUserId = courseTeacher.userId;
        } else if (enrollment.courseId.teacherId) {
          // Try to find teacher by teacherId
          const teacher = await Teacher.findById(enrollment.courseId.teacherId).select('userId').lean();
          if (teacher && teacher.userId) {
            teacherUserId = teacher.userId;
          }
        }
        
        // If not found, try to find teacher by assignedCourses
        if (!teacherUserId && enrollment.courseId._id) {
          const courseIdStr = String(enrollment.courseId._id);
          const objectIdPattern = /^[0-9a-fA-F]{24}$/;
          const isObjectId = objectIdPattern.test(courseIdStr);
          
          let query;
          if (isObjectId) {
            query = { assignedCourses: courseIdStr };
          } else {
            const numericId = parseInt(courseIdStr);
            if (!isNaN(numericId)) {
              query = { $or: [{ assignedCourses: courseIdStr }, { assignedCourses: numericId }] };
            } else {
              query = { assignedCourses: courseIdStr };
            }
          }
          
          const teacher = await Teacher.findOne(query).select('userId').lean();
          if (teacher && teacher.userId) {
            teacherUserId = teacher.userId;
          }
        }
        
        // Get student name
        const studentName = enrollment.studentId?.userId 
          ? (await User.findById(enrollment.studentId.userId).select('name').lean())?.name || 'A student'
          : 'A student';
        
        if (teacherUserId) {
          const teacherNotification = new Notification({
            receiverId: teacherUserId,
            senderId: courseTeacher ? courseTeacher._id : enrollment.courseId.teacherId || null,
            type: "student_assigned",
            message: `${studentName} has enrolled in your course "${enrollment.courseId.courseTitle}" after payment verification.`,
            data: {
              courseId: enrollment.courseId._id,
              courseTitle: enrollment.courseId.courseTitle,
              studentId: enrollment.studentId._id,
              enrollmentId: enrollment._id
            }
          });
          await teacherNotification.save();
          console.log("Teacher enrollment notification created via webhook:", teacherNotification._id);
        }
      } catch (teacherNotificationError) {
        console.error("Failed to create teacher enrollment notification via webhook:", teacherNotificationError.message);
        // Don't fail the request if teacher notification fails
      }

      return res.json({ 
        success: true, 
        message: "Payment verified and enrollment activated",
        enrollment 
      });
    }

    res.json({ 
      success: false, 
      message: "Payment not yet verified",
      status 
    });
  } catch (error) {
    console.error("WEBHOOK HANDLER ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// SEND ENROLLMENT EMAIL NOTIFICATION
exports.sendEnrollmentEmail = async (req, res) => {
  try {
    const enrollmentData = req.body;

    // Send email notification
    try {
      await sendEnrollmentEmailService(enrollmentData);
      res.json({ 
        success: true, 
        message: "Enrollment email sent successfully" 
      });
    } catch (emailError) {
      console.error("Error sending enrollment email:", emailError);
      // Don't fail the request if email fails
      res.json({ 
        success: false, 
        message: "Enrollment processed but email notification failed",
        error: emailError.message 
      });
    }
  } catch (error) {
    console.error("SEND ENROLLMENT EMAIL ERROR:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

