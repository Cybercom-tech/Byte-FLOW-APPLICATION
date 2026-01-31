const Admin = require("../models/Admin");
const Courses = require("../models/Courses");
const User = require("../models/User");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const Enrollment = require("../models/Enrollment");
const Notification = require("../models/Notification");

// Default course titles mapping (from frontend coursesData.js)
// This ensures we can display proper course names even if courses aren't in the database
const DEFAULT_COURSE_TITLES = {
  1: "Artificial Intelligence",
  2: "Big Data Analytics",
  3: "3D Animations, VR & Simulation",
  4: "Ethical Hacking: Beginner to Advanced",
  5: "Digital Marketing and SEO",
  6: "Advance Python",
  7: "Graphic Designing",
  8: "Project Management",
  9: "The Web Developer Bootcamp 2024",
  10: "Complete AWS Cloud Practitioner Guide",
  11: "Machine Learning Fundamentals",
  12: "Docker & Kubernetes: The Practical Guide",
  13: "Database Design and SQL",
  14: "Mobile App Development",
  15: "UI/UX Design",
  16: "JavaScript Fundamentals",
  17: "Python for Data Science and ML Bootcamp",
  18: "Blockchain Development",
  19: "CompTIA Security+ (SY0-601) Complete Course",
  20: "Content Marketing Strategy",
  21: "Agile and Scrum Mastery",
  22: "Video Editing and Production"
};

// GET ALL PENDING COURSES (for course moderation) - OPTIMIZED
exports.getPendingCourses = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('userType').lean();
    
    if (user.userType !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const courses = await Courses.find({ isApproved: false })
      .populate("teacherId", "fullName profTitle")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ courses });
  } catch (error) {
    console.error("GET PENDING COURSES ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// APPROVE COURSE - OPTIMIZED
exports.approveCourse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.params;
    
    const user = await User.findById(userId).select('userType').lean();
    if (user.userType !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const course = await Courses.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    course.isApproved = true;
    course.approvedAt = new Date();
    course.approvedBy = userId;
    await course.save();

    // Notify teacher
    const teacher = await Teacher.findById(course.teacherId).select('userId _id').lean();
    if (teacher) {
      const notification = new Notification({
        receiverId: teacher.userId,
        senderId: teacher._id,
        type: "course_approved",
        message: `Your course "${course.courseTitle}" has been approved and is now live.`
      });
      await notification.save();
    }

    res.json({ message: "Course approved successfully", course });
  } catch (error) {
    console.error("APPROVE COURSE ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// REJECT COURSE - OPTIMIZED
exports.rejectCourse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.params;
    const { reason } = req.body;
    
    const user = await User.findById(userId).select('userType').lean();
    if (user.userType !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const course = await Courses.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    course.isApproved = false;
    course.rejectedAt = new Date();
    course.rejectedBy = userId;
    course.rejectionReason = reason || "Course does not meet our standards";
    await course.save();

    // Notify teacher
    const teacher = await Teacher.findById(course.teacherId).select('userId _id').lean();
    if (teacher) {
      const notification = new Notification({
        receiverId: teacher.userId,
        senderId: teacher._id,
        type: "General",
        message: `Your course "${course.courseTitle}" has been rejected. Reason: ${course.rejectionReason}`
      });
      await notification.save();
    }

    res.json({ message: "Course rejected", course });
  } catch (error) {
    console.error("REJECT COURSE ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// GET ALL USERS (for user management) - OPTIMIZED
exports.getAllUsers = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('userType').lean();
    
    if (user.userType !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    // Enrich users with ban status from Student/Teacher models
    const usersWithBanStatus = await Promise.all(
      users.map(async (user) => {
        let isAccountBlocked = false;
        
        if (user.userType === "teacher") {
          const teacher = await Teacher.findOne({ userId: user._id }).select('isAccountBlocked').lean();
          if (teacher) {
            isAccountBlocked = teacher.isAccountBlocked || false;
          }
        } else if (user.userType === "student") {
          const student = await Student.findOne({ userId: user._id }).select('isAccountBlocked').lean();
          if (student) {
            isAccountBlocked = student.isAccountBlocked || false;
          }
        }
        
        return {
          ...user,
          isAccountBlocked,
          banned: isAccountBlocked // Alias for frontend compatibility
        };
      })
    );
      
    res.json({ users: usersWithBanStatus });
  } catch (error) {
    console.error("GET ALL USERS ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// BLOCK/UNBLOCK USER - OPTIMIZED
exports.toggleUserBlock = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { targetUserId } = req.params;
    const { isBlocked } = req.body;
    
    const user = await User.findById(userId).select('userType').lean();
    if (user.userType !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const targetUser = await User.findById(targetUserId).select('userType').lean();
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update based on user type
    if (targetUser.userType === "teacher") {
      await Teacher.findOneAndUpdate(
        { userId: targetUserId },
        { isAccountBlocked: isBlocked !== undefined ? isBlocked : true }
      );
    } else if (targetUser.userType === "student") {
      // Ensure Student document exists
      let student = await Student.findOne({ userId: targetUserId });
      if (!student) {
        // Create Student document if it doesn't exist
        student = new Student({ userId: targetUserId });
      }
      student.isAccountBlocked = isBlocked !== undefined ? isBlocked : true;
      await student.save();
    }

    res.json({ message: `User ${isBlocked ? "blocked" : "unblocked"} successfully` });
  } catch (error) {
    console.error("TOGGLE USER BLOCK ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// GET ALL PAYMENT SCREENSHOTS (for payment admin) - OPTIMIZED
exports.getPaymentScreenshots = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('userType').lean();
    
    if (user.userType !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    // Get enrollments with optimized query (include pending, active, and cancelled/rejected)
    const enrollments = await Enrollment.find({
      $or: [
        { status: "pending" },
        { 
          status: "active",
          paymentScreenshot: { $exists: true, $ne: null, $ne: "" }
        },
        { 
          status: "cancelled",
          paymentScreenshot: { $exists: true, $ne: null, $ne: "" }
        }
      ]
    })
      .populate({
        path: "studentId",
        select: "userId",
        populate: {
          path: "userId",
          select: "name"
        }
      })
      .populate({
        path: "courseId",
        select: "courseTitle teacherId",
        populate: {
          path: "teacherId",
          select: "fullName profTitle",
          populate: {
            path: "userId",
            select: "name"
          }
        }
      })
      .sort({ createdAt: -1 })
      .lean();

    // Process enrollments to add course and instructor information
    const enrollmentsWithDetails = await Promise.all(
      enrollments.map(async (enrollment) => {
        let courseTitle = "Unknown Course";
        let instructorName = "Course Instructor";
        
        // Get courseId - handle both ObjectId and string/numeric IDs
        let courseIdValue = enrollment.courseId;
        let courseIdStr = '';
        
        if (courseIdValue) {
          if (typeof courseIdValue === 'object' && courseIdValue._id) {
            // Populated course (MongoDB ObjectId)
            courseIdStr = String(courseIdValue._id);
            courseTitle = courseIdValue.courseTitle || "Unknown Course";
            
            // Get instructor from populated teacherId
            if (courseIdValue.teacherId) {
              if (typeof courseIdValue.teacherId === 'object') {
                instructorName = courseIdValue.teacherId.fullName || 
                                 courseIdValue.teacherId.userId?.name || 
                                 "Course Instructor";
              }
            } else {
              // Try to find assigned teacher for this course
              const teacher = await Teacher.findOne({
                assignedCourses: courseIdValue._id
              }).select("fullName userId").lean();
              
              if (teacher) {
                if (teacher.userId) {
                  const user = await User.findById(teacher.userId).select("name").lean();
                  instructorName = user?.name || teacher.fullName || "Course Instructor";
                } else {
                  instructorName = teacher.fullName || "Course Instructor";
                }
              }
            }
          } else {
            // String or numeric courseId (default course)
            courseIdStr = String(courseIdValue);
            const objectIdPattern = /^[0-9a-fA-F]{24}$/;
            const isObjectId = objectIdPattern.test(courseIdStr);
            
            if (!isObjectId) {
              // Default course (numeric ID) - not in database
              // Try to find assigned teacher
              const numericCourseId = parseInt(courseIdStr);
              if (!isNaN(numericCourseId)) {
                const teacher = await Teacher.findOne({
                  $or: [
                    { assignedCourses: courseIdStr },
                    { assignedCourses: numericCourseId }
                  ]
                }).select("fullName userId").lean();
                
                if (teacher) {
                  if (teacher.userId) {
                    const user = await User.findById(teacher.userId).select("name").lean();
                    instructorName = user?.name || teacher.fullName || "Course Instructor";
                  } else {
                    instructorName = teacher.fullName || "Course Instructor";
                  }
                }
                
                // For default courses, title will be set by frontend from coursesData
                // Backend just provides a placeholder
                courseTitle = `Course ${courseIdStr}`;
              }
            }
          }
        }
        
        return {
          ...enrollment,
          studentName: enrollment.studentId?.userId?.name || "Unknown Student",
          courseTitle: courseTitle,
          instructorName: instructorName
        };
      })
    );

    res.json({ enrollments: enrollmentsWithDetails || [] });
  } catch (error) {
    console.error("GET PAYMENT SCREENSHOTS ERROR:", error.message);
    res.status(500).json({ message: "Server error", enrollments: [] });
  }
};

// VERIFY PAYMENT AND ACTIVATE ENROLLMENT - OPTIMIZED
exports.verifyPayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { enrollmentId } = req.params;
    
    const user = await User.findById(userId).select('userType').lean();
    if (user.userType !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const enrollment = await Enrollment.findById(enrollmentId)
      .populate("studentId", "userId")
      .populate("courseId", "courseTitle teacherId");

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    // Helper function to get course title
    const getCourseTitleFromEnrollment = async (enrollment) => {
      if (enrollment.courseId) {
        if (typeof enrollment.courseId === 'object' && enrollment.courseId.courseTitle) {
          // ObjectId course - already populated
          return enrollment.courseId.courseTitle;
        } else {
          // String/numeric courseId - fetch course details manually
          const courseIdStr = String(enrollment.courseId);
          const objectIdPattern = /^[0-9a-fA-F]{24}$/;
          const isObjectId = objectIdPattern.test(courseIdStr);
          
          if (isObjectId) {
            const foundCourse = await Courses.findOne({ _id: courseIdStr }).select('courseTitle').lean();
            if (foundCourse && foundCourse.courseTitle) {
              return foundCourse.courseTitle;
            }
          } else {
            const foundCourse = await Courses.findOne({ courseId: courseIdStr }).select('courseTitle').lean();
            if (foundCourse && foundCourse.courseTitle) {
              return foundCourse.courseTitle;
            }
            // For default courses not in database, return generic name
            // Frontend will enrich this
            return `Course ${courseIdStr}`;
          }
        }
      }
      return "the course";
    };
    
    // Get course details (handle both ObjectId and string courseIds)
    let courseTitle = await getCourseTitleFromEnrollment(enrollment);
    let teacherId = null;
    
    if (enrollment.courseId) {
      if (typeof enrollment.courseId === 'object' && enrollment.courseId.teacherId) {
        teacherId = enrollment.courseId.teacherId;
      } else {
        const courseIdStr = String(enrollment.courseId);
        const objectIdPattern = /^[0-9a-fA-F]{24}$/;
        const isObjectId = objectIdPattern.test(courseIdStr);
        
        if (isObjectId) {
          const foundCourse = await Courses.findOne({ _id: courseIdStr }).select('teacherId').lean();
          if (foundCourse) teacherId = foundCourse.teacherId;
        } else {
          const foundCourse = await Courses.findOne({ courseId: courseIdStr }).select('teacherId').lean();
          if (foundCourse) teacherId = foundCourse.teacherId;
        }
      }
    }
    
    console.log("Verify payment - Course title resolved:", courseTitle);

    enrollment.status = "active";
    enrollment.verifiedAt = new Date();
    enrollment.verifiedBy = userId;
    await enrollment.save();

    // Create notification for student
    try {
      let senderId = teacherId;
      
      if (!senderId) {
        const defaultTeacher = await Teacher.findOne().select('_id').lean();
        if (defaultTeacher) senderId = defaultTeacher._id;
      }
      
      if (enrollment.studentId?.userId && senderId) {
        console.log("Creating approval notification for student:", {
          receiverId: enrollment.studentId.userId,
          senderId: senderId,
          courseTitle
        });
        
        const notification = new Notification({
          receiverId: enrollment.studentId.userId,
          senderId: senderId,
          type: "payment_approved",
          message: `Your payment for "${courseTitle}" has been verified. You now have access to the course!`,
          data: {
            courseId: enrollment.courseId?._id || enrollment.courseId,
            courseTitle: courseTitle
          }
        });
        await notification.save();
        console.log("Approval notification created successfully:", notification._id);
      } else {
        console.warn("Cannot create notification - missing data:", {
          hasStudentUserId: !!enrollment.studentId?.userId,
          hasSenderId: !!senderId
        });
      }
    } catch (notificationError) {
      console.error("Failed to create payment notification:", notificationError.message);
      console.error("Notification error stack:", notificationError.stack);
    }

    // Create notification for teacher about new student enrollment
    try {
      let teacher = null;
      let teacherUserId = null;
      
      // First try to find teacher by teacherId from course
      if (teacherId) {
        teacher = await Teacher.findById(teacherId).select('userId fullName').lean();
        if (teacher && teacher.userId) {
          teacherUserId = teacher.userId;
        }
      }
      
      // If not found by teacherId, try to find teacher by assignedCourses
      if (!teacherUserId && enrollment.courseId) {
        const courseIdStr = String(enrollment.courseId?._id || enrollment.courseId);
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
        
        teacher = await Teacher.findOne(query).select('userId fullName').lean();
        if (teacher && teacher.userId) {
          teacherUserId = teacher.userId;
        }
      }
      
      // Get student name for the notification
      const studentName = enrollment.studentId?.userId 
        ? (await User.findById(enrollment.studentId.userId).select('name').lean())?.name || 'A student'
        : 'A student';
      
      if (teacherUserId) {
        console.log("Creating enrollment notification for teacher:", {
          receiverId: teacherUserId,
          courseTitle,
          studentName
        });
        
        // Use admin as sender (or the teacher themselves as sender)
        const adminUser = await User.findById(userId).select('_id').lean();
        const senderIdForTeacher = adminUser?._id || teacherId || teacher?._id;
        
        const teacherNotification = new Notification({
          receiverId: teacherUserId,
          senderId: senderIdForTeacher,
          type: "student_assigned",
          message: `${studentName} has enrolled in your course "${courseTitle}" after payment verification.`,
          data: {
            courseId: enrollment.courseId?._id || enrollment.courseId,
            courseTitle: courseTitle,
            studentId: enrollment.studentId?._id || enrollment.studentId,
            enrollmentId: enrollment._id
          }
        });
        await teacherNotification.save();
        console.log("Teacher enrollment notification created successfully:", teacherNotification._id);
      } else {
        console.warn("Cannot create teacher notification - teacher not found for course:", {
          courseId: enrollment.courseId?._id || enrollment.courseId,
          teacherId: teacherId
        });
      }
    } catch (teacherNotificationError) {
      console.error("Failed to create teacher enrollment notification:", teacherNotificationError.message);
      console.error("Teacher notification error stack:", teacherNotificationError.stack);
      // Don't fail the request if teacher notification fails
    }

    res.json({ message: "Payment verified and enrollment activated", enrollment });
  } catch (error) {
    console.error("VERIFY PAYMENT ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// REJECT PAYMENT AND CANCEL ENROLLMENT - OPTIMIZED
exports.rejectPayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { enrollmentId } = req.params;
    const { reason } = req.body;
    
    const user = await User.findById(userId).select('userType').lean();
    if (user.userType !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const enrollment = await Enrollment.findById(enrollmentId)
      .populate("studentId", "userId")
      .populate("courseId", "courseTitle teacherId");

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    // Helper function to get course title
    const getCourseTitleFromEnrollment = async (enrollment) => {
      if (enrollment.courseId) {
        if (typeof enrollment.courseId === 'object' && enrollment.courseId.courseTitle) {
          // ObjectId course - already populated
          return enrollment.courseId.courseTitle;
        } else {
          // String/numeric courseId - fetch course details manually
          const courseIdStr = String(enrollment.courseId);
          const objectIdPattern = /^[0-9a-fA-F]{24}$/;
          const isObjectId = objectIdPattern.test(courseIdStr);
          
          if (isObjectId) {
            const foundCourse = await Courses.findOne({ _id: courseIdStr }).select('courseTitle').lean();
            if (foundCourse && foundCourse.courseTitle) {
              return foundCourse.courseTitle;
            }
          } else {
            const foundCourse = await Courses.findOne({ courseId: courseIdStr }).select('courseTitle').lean();
            if (foundCourse && foundCourse.courseTitle) {
              return foundCourse.courseTitle;
            }
            // For default courses not in database, return generic name
            // Frontend will enrich this
            return `Course ${courseIdStr}`;
          }
        }
      }
      return "the course";
    };
    
    // Get course details (handle both ObjectId and string courseIds)
    let courseTitle = await getCourseTitleFromEnrollment(enrollment);
    let teacherId = null;
    
    if (enrollment.courseId) {
      if (typeof enrollment.courseId === 'object' && enrollment.courseId.teacherId) {
        teacherId = enrollment.courseId.teacherId;
      } else {
        const courseIdStr = String(enrollment.courseId);
        const objectIdPattern = /^[0-9a-fA-F]{24}$/;
        const isObjectId = objectIdPattern.test(courseIdStr);
        
        if (isObjectId) {
          const foundCourse = await Courses.findOne({ _id: courseIdStr }).select('teacherId').lean();
          if (foundCourse) teacherId = foundCourse.teacherId;
        } else {
          const foundCourse = await Courses.findOne({ courseId: courseIdStr }).select('teacherId').lean();
          if (foundCourse) teacherId = foundCourse.teacherId;
        }
      }
    }
    
    console.log("Reject payment - Course title resolved:", courseTitle);

    // Update enrollment status to cancelled
    enrollment.status = "cancelled";
    enrollment.rejectedAt = new Date();
    enrollment.rejectedBy = userId;
    enrollment.rejectionReason = reason || "Payment verification failed";
    await enrollment.save();

    // Create notification for student
    try {
      let senderId = teacherId;
      
      if (!senderId) {
        const defaultTeacher = await Teacher.findOne().select('_id').lean();
        if (defaultTeacher) senderId = defaultTeacher._id;
      }
      
      if (enrollment.studentId?.userId && senderId) {
        console.log("Creating rejection notification for student:", {
          receiverId: enrollment.studentId.userId,
          senderId: senderId,
          courseTitle,
          reason: enrollment.rejectionReason
        });
        
        const notification = new Notification({
          receiverId: enrollment.studentId.userId,
          senderId: senderId,
          type: "payment_rejected",
          message: `Your payment for "${courseTitle}" has been rejected. Reason: ${enrollment.rejectionReason}. Please contact support or submit a new payment.`,
          data: {
            courseId: enrollment.courseId?._id || enrollment.courseId,
            courseTitle: courseTitle,
            rejectionReason: enrollment.rejectionReason
          }
        });
        await notification.save();
        console.log("Rejection notification created successfully:", notification._id);
      } else {
        console.warn("Cannot create notification - missing data:", {
          hasStudentUserId: !!enrollment.studentId?.userId,
          hasSenderId: !!senderId
        });
      }
    } catch (notificationError) {
      console.error("Failed to create rejection notification:", notificationError.message);
      console.error("Notification error stack:", notificationError.stack);
    }

    res.json({ message: "Payment rejected and enrollment cancelled", enrollment });
  } catch (error) {
    console.error("REJECT PAYMENT ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// GET ALL COMPLETED COURSES REQUIRING CERTIFICATES - OPTIMIZED
exports.getCertificateRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('userType').lean();
    
    if (user.userType !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    // Get all completed enrollments (include both sent and unsent for "All" view)
    // Check both isCompleted flag and status field to catch all completed courses
    const enrollments = await Enrollment.find({
      $or: [
        { isCompleted: true },
        { status: "completed" }
      ]
    })
      .populate({
        path: "studentId",
        select: "userId",
        populate: {
          path: "userId",
          select: "name email"
        }
      })
      .sort({ updatedAt: -1 }) // Most recently completed first
      .lean();

    console.log(`Found ${enrollments.length} completed enrollments for certificate management`);

    // Helper function to get course title (works for both ObjectId and default courses)
    const getCourseTitle = async (courseId) => {
      try {
        const courseIdStr = String(courseId);
        const objectIdPattern = /^[0-9a-fA-F]{24}$/;
        const isObjectId = objectIdPattern.test(courseIdStr);
        
        if (isObjectId) {
          // MongoDB ObjectId - fetch from database
          const course = await Courses.findOne({ _id: courseId }).select('courseTitle').lean();
          if (course?.courseTitle) {
            return course.courseTitle;
          }
        } else {
          // Default course (numeric ID) - try to find in database with both string and number
          const numericId = parseInt(courseIdStr);
          const isNumeric = !isNaN(numericId) && String(numericId) === courseIdStr;
          
          if (isNumeric) {
            // Try both string and number format in database
            const course = await Courses.findOne({
              $or: [
                { courseId: courseIdStr },
                { courseId: numericId }
              ]
            }).select('courseTitle').lean();
            
            if (course?.courseTitle) {
              return course.courseTitle;
            }
            
            // If not in database, check default course titles mapping
            if (DEFAULT_COURSE_TITLES[numericId]) {
              return DEFAULT_COURSE_TITLES[numericId];
            }
          } else {
            // Try string match in database
            const course = await Courses.findOne({ courseId: courseIdStr }).select('courseTitle').lean();
            if (course?.courseTitle) {
              return course.courseTitle;
            }
          }
        }
        
        return null; // Return null if not found, will use fallback
      } catch (error) {
        console.error("Error getting course title:", error.message);
        return null;
      }
    };

    // Enrich with course titles
    const certificateRequests = await Promise.all(
      enrollments.map(async (enrollment) => {
        const courseIdStr = String(enrollment.courseId);
        let courseTitle = await getCourseTitle(enrollment.courseId);
        
        // Fallback to generic name if not found in database
        if (!courseTitle) {
          courseTitle = `Course ${courseIdStr}`;
        }
        
        return {
          enrollmentId: enrollment._id.toString(),
          studentName: enrollment.studentId?.userId?.name || "Unknown Student",
          studentEmail: enrollment.studentId?.userId?.email || "N/A",
          courseTitle: courseTitle,
          courseId: enrollment.courseId,
          completedAt: enrollment.updatedAt || enrollment.createdAt,
          certificateSent: enrollment.certificateSent === true // Explicitly check for true
        };
      })
    );

    res.json({ certificateRequests });
  } catch (error) {
    console.error("GET CERTIFICATE REQUESTS ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// MARK CERTIFICATE AS SENT - OPTIMIZED
exports.markCertificateSent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { enrollmentId } = req.params;
    
    const user = await User.findById(userId).select('userType').lean();
    if (user.userType !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    if (!enrollment.isCompleted) {
      return res.status(400).json({ message: "Course is not completed yet" });
    }

    // Mark certificate as sent
    enrollment.certificateSent = true;
    enrollment.certificateSentAt = new Date();
    enrollment.certificateSentBy = userId;
    await enrollment.save();

    res.json({ 
      message: "Certificate marked as sent successfully",
      enrollment: {
        enrollmentId: enrollment._id.toString(),
        certificateSent: enrollment.certificateSent,
        certificateSentAt: enrollment.certificateSentAt
      }
    });
  } catch (error) {
    console.error("MARK CERTIFICATE SENT ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};