const mongoose = require("mongoose");
const Courses = require("../models/Courses");
const Student = require("../models/Student");
const Enrollment = require("../models/Enrollment");
const User = require("../models/User");
const Admin = require("../models/Admin");
const Notification = require("../models/Notification");
const Teacher = require("../models/Teacher");

// Default courses from coursesData.js (pre-approved courses that may not exist in DB)
// These are numeric IDs (1-22) that represent default/pre-made courses
const DEFAULT_COURSE_ID_MIN = 1;
const DEFAULT_COURSE_ID_MAX = 100; // Reasonable upper limit for default courses

// ✅ CREATE STUDENT PROFILE
exports.createStudentProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { profileImage } = req.body;

    // Check if student profile already exists
    const existing = await Student.findOne({ userId }).lean();
    if (existing) {
      return res.status(200).json({ 
        message: "Student profile already exists",
        student: existing
      });
    }

    // Creates student profile
    const student = new Student({
      userId,
      profileImage: profileImage || ""
    });

    await student.save();

    res.status(201).json({
      message: "Student profile created successfully",
      student
    });

  } catch (error) {
    console.error("CREATE STUDENT ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};


// Enroll student in a course - OPTIMIZED
exports.enrollInCourse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId, paymentMethod, transactionId, amountPaid, requiresVerification, paymentScreenshot } = req.body;

    console.log("Enrollment request:", { courseId, userId, isObjectId: /^[0-9a-fA-F]{24}$/.test(String(courseId)) });

    // Get student
    const student = await Student.findOne({ userId }).lean();
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check course - handle both MongoDB ObjectIds and numeric IDs
    const courseIdStr = String(courseId);
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    const isObjectId = objectIdPattern.test(courseIdStr);
    
    console.log("Course ID details:", { courseIdStr, isObjectId });
    
    // Check for existing enrollment
    const existing = await Enrollment.findOne({
      studentId: student._id,
      courseId: isObjectId ? courseId : courseIdStr
    });

    let course = null;
    
    if (existing) {
      // If already active, can't enroll again
      if (existing.status === "active") {
        return res.status(400).json({ message: "Already enrolled in this course" });
      }
      
      // If cancelled/rejected, keep it as history and create a NEW enrollment
      // If pending, update the existing one
      if (existing.status === "cancelled") {
        console.log("Found cancelled enrollment, allowing re-enrollment");
        // Fetch course details for notifications (optional - not blocking)
        if (isObjectId) {
          course = await Courses.findOne({ _id: courseId }).select('courseTitle teacherId').lean();
        } else {
          course = await Courses.findOne({ courseId: courseIdStr }).select('courseTitle teacherId').lean();
        }
        
        if (course) {
          console.log("Course found for re-enrollment:", course.courseTitle);
        } else {
          console.log("Course not found in DB, but allowing re-enrollment since previous enrollment exists");
          // Set a placeholder course object so notifications can still work
          course = { courseTitle: "Course", teacherId: null };
        }
        
        // Allow enrollment to continue - create new enrollment below
        // This keeps the rejected enrollment as history
      } else if (existing.status === "pending") {
        // Update existing pending enrollment (not yet rejected)
        const hadPaymentInfo = existing.paymentMethod || existing.transactionId || existing.amountPaid > 0 || existing.paymentScreenshot;
        const isAddingPaymentInfo = (paymentMethod || transactionId || amountPaid > 0 || paymentScreenshot) && !hadPaymentInfo;
        
        // Fetch course details for notifications
        if (isObjectId) {
          course = await Courses.findOne({ _id: courseId }).select('courseTitle teacherId').lean();
        } else {
          course = await Courses.findOne({ courseId: courseIdStr }).select('courseTitle teacherId').lean();
        }
        
        existing.paymentMethod = paymentMethod || existing.paymentMethod;
        existing.transactionId = transactionId || existing.transactionId;
        existing.amountPaid = amountPaid || existing.amountPaid;
        existing.verificationRequired = requiresVerification !== undefined ? requiresVerification : existing.verificationRequired;
        if (paymentScreenshot) {
          existing.paymentScreenshot = paymentScreenshot;
        }
        
        await existing.save();
        
        // Notify payment admins if payment info was just added
        if (isAddingPaymentInfo && existing.verificationRequired && existing.status === "pending") {
          await notifyPaymentAdmins(userId, courseId, course, existing.amountPaid, isObjectId);
        }
        
        return res.json({ message: "Enrollment updated", enrollment: existing });
      }
    }
    
    // For new enrollments (or re-enrollment after rejection), validate course exists
    // Skip validation if course was already fetched (for cancelled re-enrollment)
    if (!course) {
      console.log("Course not yet fetched, fetching now...");
      if (isObjectId) {
        course = await Courses.findOne({ _id: courseId, isApproved: true }).select('courseTitle teacherId').lean();
        console.log("ObjectId course lookup:", course ? "Found" : "Not found");
        if (!course) {
          return res.status(404).json({ message: "Course not found or not approved" });
        }
      } else {
        // For non-ObjectId courses (default courses from coursesData)
        // These are pre-made courses that are approved by default
        const numericCourseId = parseInt(courseIdStr, 10);
        const isValidDefaultCourseId = !isNaN(numericCourseId) && 
                                       numericCourseId >= DEFAULT_COURSE_ID_MIN && 
                                       numericCourseId <= DEFAULT_COURSE_ID_MAX;
        
        console.log("Looking up non-ObjectId course:", {
          courseIdStr,
          numericCourseId,
          isValidDefaultCourseId
        });
        
        // Try to find course in database first (in case it was seeded)
        course = await Courses.findOne({ courseId: courseIdStr, isApproved: true })
          .select('courseTitle teacherId courseId')
          .lean();
        
        if (!course) {
          // Try without isApproved requirement (for default courses that might not have isApproved set)
          course = await Courses.findOne({ courseId: courseIdStr })
            .select('courseTitle teacherId courseId')
            .lean();
        }
        
        // If course not found in database, validate and allow enrollment for valid default courses
        if (!course) {
          if (!isValidDefaultCourseId) {
            console.error("Invalid default course ID:", {
              courseIdStr,
              numericCourseId,
              validRange: `${DEFAULT_COURSE_ID_MIN}-${DEFAULT_COURSE_ID_MAX}`
            });
            return res.status(404).json({ 
              message: `Invalid course ID. Default courses must have numeric IDs between ${DEFAULT_COURSE_ID_MIN} and ${DEFAULT_COURSE_ID_MAX}.` 
            });
          }
          
          // Default courses from coursesData are pre-approved and don't need to exist in DB
          console.log("Default course not in database, allowing enrollment (pre-approved default course):", {
            courseId: courseIdStr,
            numericId: numericCourseId
          });
          
          // Create a virtual course object for enrollment
          // Note: This allows enrollment even if course doesn't exist in DB
          // The course data comes from the frontend coursesData.js
          course = {
            courseTitle: `Default Course ${courseIdStr}`,
            teacherId: null,
            courseId: courseIdStr,
            isDefaultCourse: true, // Flag to indicate this is a default course
            isApproved: true // Default courses are pre-approved
          };
        } else {
          // Course found in database - verify it's approved
          if (course.isApproved === false) {
            console.warn("Course found but not approved:", {
              courseId: courseIdStr,
              courseTitle: course.courseTitle
            });
            return res.status(403).json({ 
              message: "This course exists but is not approved for enrollment yet. Please contact support." 
            });
          }
        }
      }
    } else {
      console.log("Course already fetched:", course.courseTitle);
    }

    // Determine enrollment status
    const status = requiresVerification ? "pending" : "active";

    // Create enrollment (store ObjectId for DB courses, string for default - same as review lookups)
    const enrollment = new Enrollment({
      studentId: student._id,
      courseId: isObjectId ? (typeof courseId === 'string' ? new mongoose.Types.ObjectId(courseId) : courseId) : courseIdStr,
      status,
      paymentMethod: paymentMethod || null,
      transactionId: transactionId || null,
      amountPaid: amountPaid || 0,
      paymentScreenshot: paymentScreenshot || null,
      verificationRequired: requiresVerification || false,
      progress: status === "active" ? 0 : null,
      currentSection: status === "active" ? "Introduction" : null,
      lastAccessed: status === "active" ? new Date() : null
    });

    await enrollment.save();

    // Notify payment admins if verification required
    if (requiresVerification && status === "pending") {
      await notifyPaymentAdmins(userId, courseId, course, amountPaid, isObjectId);
    }

    res.status(201).json({
      message: requiresVerification ? "Enrollment submitted. Waiting for payment verification." : "Enrolled successfully",
      enrollment
    });

  } catch (error) {
    console.error("ENROLL ERROR:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// Helper function to get course title (works for both ObjectId and default courses)
async function getCourseTitle(courseId, course = null) {
  try {
    // First try to get from provided course object
    if (course?.courseTitle && course.courseTitle !== "Course" && course.courseTitle !== `Default Course ${String(courseId)}`) {
      return course.courseTitle;
    }
    
    const courseIdStr = String(courseId);
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    const isObjectId = objectIdPattern.test(courseIdStr);
    
    if (isObjectId) {
      // MongoDB ObjectId - fetch from database
      const foundCourse = await Courses.findOne({ _id: courseId }).select('courseTitle').lean();
      if (foundCourse && foundCourse.courseTitle) {
        return foundCourse.courseTitle;
      }
    } else {
      // Default course (numeric ID) - try to find in database first
      const foundCourse = await Courses.findOne({ courseId: courseIdStr }).select('courseTitle').lean();
      if (foundCourse && foundCourse.courseTitle) {
        return foundCourse.courseTitle;
      }
      
      // For default courses not in database, we'll use a generic name
      // The frontend will enrich this with actual course title from coursesData
      // But we should try to get it from enrollment if available
      return `Course ${courseIdStr}`;
    }
    
    return "Course";
  } catch (error) {
    console.error("Error getting course title:", error.message);
    return "Course";
  }
}

// Helper function to notify general admins about certificate requirement
async function notifyGeneralAdminsForCertificate(enrollment, courseTitle, studentName, studentEmail) {
  try {
    // Get general admins
    const [adminUsers, adminRecords] = await Promise.all([
      User.find({ userType: "admin" }).select('_id').lean(),
      Admin.find({}).lean()
    ]);
    
    const adminTypeMap = new Map(adminRecords.map(a => [a.userId.toString(), a.adminType]));
    
    const generalAdmins = adminUsers.filter(admin => {
      const adminType = adminTypeMap.get(admin._id.toString());
      return adminType === "general" || adminType === undefined;
    });
    
    if (generalAdmins.length === 0) return;

    // Get teacher for senderId
    let teacherId = null;
    const courseIdStr = String(enrollment.courseId);
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    const isObjectId = objectIdPattern.test(courseIdStr);
    
    if (isObjectId) {
      const course = await Courses.findOne({ _id: enrollment.courseId }).select('teacherId').lean();
      if (course?.teacherId) {
        teacherId = course.teacherId;
      }
    }
    
    // Fallback to default teacher if no teacher found
    if (!teacherId) {
      const defaultTeacher = await Teacher.findOne().select('_id').lean();
      if (defaultTeacher) teacherId = defaultTeacher._id;
    }
    
    if (!teacherId) return;

    // Create notifications for all general admins
    const notifications = generalAdmins.map(admin => ({
      receiverId: admin._id,
      senderId: teacherId,
      type: "certificate_required",
      message: `Certificate required: "${studentName}" (${studentEmail}) has completed "${courseTitle}". Please send the certificate.`,
      data: {
        enrollmentId: enrollment._id.toString(),
        courseId: enrollment.courseId,
        courseTitle: courseTitle,
        studentName: studentName,
        studentEmail: studentEmail
      }
    }));

    await Notification.insertMany(notifications);
    console.log(`Certificate notifications created for ${generalAdmins.length} general admin(s)`);
  } catch (error) {
    console.error("Error notifying general admins for certificate:", error.message);
  }
}

// Helper function to notify payment admins - reduces code duplication
async function notifyPaymentAdmins(userId, courseId, course, amountPaid, isObjectId) {
  try {
    // Get payment admins with batch queries
    const [adminUsers, studentUser] = await Promise.all([
      User.find({ userType: "admin" }).select('_id').lean(),
      User.findById(userId).select('name').lean()
    ]);
    
    const adminRecords = await Admin.find({ 
      userId: { $in: adminUsers.map(u => u._id) },
      adminType: "payment"
    }).lean();
    
    const paymentAdminIds = new Set(adminRecords.map(a => a.userId.toString()));
    const paymentAdmins = adminUsers.filter(admin => paymentAdminIds.has(admin._id.toString()));
    
    if (paymentAdmins.length === 0) return;

    // Get course title using helper function
    const courseTitle = await getCourseTitle(courseId, course);
    const studentName = studentUser?.name || "Student";
    
    // Get teacher for senderId
    let teacherId = null;
    if (isObjectId && course?.teacherId) {
      teacherId = course.teacherId;
    } else {
      const defaultTeacher = await Teacher.findOne().select('_id').lean();
      if (defaultTeacher) teacherId = defaultTeacher._id;
    }
    
    if (!teacherId) return;

    console.log("Creating payment admin notifications with course title:", courseTitle);

    // BATCH INSERT notifications
    const notifications = paymentAdmins.map(admin => ({
      receiverId: admin._id,
      senderId: teacherId,
      type: "new_payment",
      message: `New payment of PKR ${(amountPaid || 0).toLocaleString()} received from "${studentName}" for "${courseTitle}". Payment verification required.`,
      data: {
        courseId: courseId,
        courseTitle: courseTitle,
        amountPaid: amountPaid,
        studentName: studentName
      }
    }));

    await Notification.insertMany(notifications);
  } catch (error) {
    console.error("Error notifying payment admins:", error.message);
  }
}

// GET ENROLLMENTS FOR STUDENT - OPTIMIZED
exports.getMyEnrollments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const student = await Student.findOne({ userId }).select('_id').lean();
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const enrollments = await Enrollment.find({ studentId: student._id })
      .populate("courseId")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ enrollments });
  } catch (error) {
    console.error("GET ENROLLMENTS ERROR:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// UPDATE COURSE PROGRESS
exports.updateProgress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { enrollmentId } = req.params;
    const { progress, currentSection, completedSections } = req.body;

    const student = await Student.findOne({ userId }).select('_id').lean();
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      studentId: student._id,
      status: "active"
    });

    if (!enrollment) {
      return res.status(404).json({ message: "Active enrollment not found" });
    }

    // Track previous progress to detect completion
    const previousProgress = enrollment.progress || 0;
    const wasCompleted = enrollment.isCompleted || previousProgress >= 100;

    if (progress !== undefined) {
      enrollment.progress = Math.min(100, Math.max(0, progress));
    }
    if (currentSection) {
      enrollment.currentSection = currentSection;
    }
    if (completedSections) {
      enrollment.completedSections = completedSections;
    }
    
    // Mark as completed if progress reaches 100%
    if (enrollment.progress >= 100) {
      enrollment.isCompleted = true;
    }
    
    enrollment.lastAccessed = new Date();

    await enrollment.save();

    // Check if course was just completed (progress reached 100% from less than 100%)
    const justCompleted = !wasCompleted && enrollment.progress >= 100 && enrollment.isCompleted;
    
    if (justCompleted) {
      // Create congratulatory notification with certificate message
      try {
        // Get course title
        const courseTitle = await getCourseTitle(enrollment.courseId, null);
        
        // Get student name and email
        const studentUser = await User.findById(userId).select('name email').lean();
        const studentName = studentUser?.name || "Student";
        const studentEmail = studentUser?.email || "";
        
        // Get teacher for senderId (same pattern as notifyPaymentAdmins)
        const courseIdStr = String(enrollment.courseId);
        const objectIdPattern = /^[0-9a-fA-F]{24}$/;
        const isObjectId = objectIdPattern.test(courseIdStr);
        
        let teacherId = null;
        if (isObjectId) {
          const course = await Courses.findOne({ _id: enrollment.courseId }).select('teacherId').lean();
          if (course?.teacherId) {
            teacherId = course.teacherId;
          }
        }
        
        // Fallback to default teacher if no teacher found
        if (!teacherId) {
          const defaultTeacher = await Teacher.findOne().select('_id').lean();
          if (defaultTeacher) teacherId = defaultTeacher._id;
        }
        
        if (teacherId) {
          // Create notification for student
          const notification = new Notification({
            receiverId: userId,
            senderId: teacherId,
            type: "course_completed",
            message: `Congratulations! You have successfully completed "${courseTitle}". Your certificate of completion will be sent to your email address.`,
            data: {
              courseId: enrollment.courseId,
              courseTitle: courseTitle,
              enrollmentId: enrollment._id.toString()
            }
          });
          
          await notification.save();
          console.log("Course completion notification created for student:", studentName, "Course:", courseTitle);
          
          // Notify general admins about certificate requirement
          await notifyGeneralAdminsForCertificate(enrollment, courseTitle, studentName, studentEmail);
        } else {
          console.warn("Could not create completion notification: No teacher found");
        }
      } catch (notificationError) {
        // Don't fail the progress update if notification fails
        console.error("Error creating completion notification:", notificationError.message);
      }
    }

    res.json({ message: "Progress updated", enrollment, isCompleted: justCompleted });
  } catch (error) {
    console.error("UPDATE PROGRESS ERROR:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// GET STUDENT DASHBOARD - OPTIMIZED with aggregation
exports.getStudentDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;

    const student = await Student.findOne({ userId }).select('_id').lean();
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Use aggregation for faster computation
    const enrollments = await Enrollment.find({ studentId: student._id })
      .select('isCompleted progress upcomingClassDate')
      .lean();

    const totalEnrolled = enrollments.length;
    const completedCourses = enrollments.filter(e => e.isCompleted).length;
    const averageProgress = enrollments.length
      ? enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length
      : 0;
    const upcomingClasses = enrollments.filter(e => e.upcomingClassDate && e.upcomingClassDate >= new Date()).length;

    res.json({
      message: "Student Dashboard",
      totalEnrolled,
      completedCourses,
      averageProgress,
      upcomingClasses
    });

  } catch (error) {
    console.error("GET STUDENT DASHBOARD ERROR:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};
