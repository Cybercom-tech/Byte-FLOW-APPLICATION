const Teacher = require("../models/Teacher");
const Courses = require("../models/Courses");
const Enrollment = require("../models/Enrollment");
const Student = require("../models/Student");
const User = require("../models/User");
const mongoose = require("mongoose");

// ✅ CREATE OR UPDATE TEACHER PROFILE
exports.createTeacherProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const data = req.body;

    // Check if profile already exists
    const existing = await Teacher.findOne({ userId });

    // Map frontend field names to backend model field names
    const mappedData = {
      fullName: data.fullName || data.name || '',
      profTitle: data.profTitle || data.title || '',
      phoneNumber: data.phoneNumber || data.phone || '',
      location: data.location || '',
      aboutMe: data.aboutMe || data.about || '',
      email: data.email || '',
      education: (data.education || [])
        .filter(edu => (edu.instName || edu.institution || edu.institute) && (edu.degreeName || edu.degree))
        .map(edu => {
          const startDate = edu.startDate ? new Date(edu.startDate) : new Date();
          const endDate = edu.endDate ? new Date(edu.endDate) : null;
          return {
            instName: edu.instName || edu.institution || edu.institute || '',
            degreeName: edu.degreeName || edu.degree || '',
            fieldOfStudy: edu.fieldOfStudy || edu.field || '',
            startDate: isNaN(startDate.getTime()) ? new Date() : startDate,
            endDate: endDate && !isNaN(endDate.getTime()) ? endDate : null,
            isCurrentlyEnrolled: edu.isCurrentlyEnrolled || edu.currentlyStudying || false
          };
        }),
      experience: (data.experience || [])
        .filter(exp => (exp.companyName || exp.company) && (exp.position || exp.title))
        .map(exp => {
          const startDate = exp.startDate ? new Date(exp.startDate) : new Date();
          const endDate = exp.endDate ? new Date(exp.endDate) : null;
          return {
            companyName: exp.companyName || exp.company || '',
            position: exp.position || exp.title || '',
            description: exp.description || '',
            startDate: isNaN(startDate.getTime()) ? new Date() : startDate,
            endDate: endDate && !isNaN(endDate.getTime()) ? endDate : null,
            isCurrentlyWorking: exp.isCurrentlyWorking || exp.currentlyWorking || false
          };
        }),
      certificatesCourses: (data.certificates || data.certificatesCourses || [])
        .filter(cert => (cert.certificateName || cert.name) && (cert.organization || cert.issuingOrganization || cert.issuer))
        .map(cert => {
          const issueDate = cert.issueDate ? new Date(cert.issueDate) : null;
          const expiryDate = cert.expiryDate ? new Date(cert.expiryDate) : null;
          return {
            certificateName: cert.certificateName || cert.name || '',
            organization: cert.organization || cert.issuingOrganization || cert.issuer || '',
            credentialID: cert.credentialID || cert.credentialId || cert.id || '',
            issueDate: issueDate && !isNaN(issueDate.getTime()) ? issueDate : null,
            expiryDate: expiryDate && !isNaN(expiryDate.getTime()) ? expiryDate : null
          };
        }),
      assignedCourses: []
    };

    // Validate required fields
    const requiredFields = ['fullName', 'profTitle', 'phoneNumber', 'location', 'aboutMe'];
    const missingFields = requiredFields.filter(field => !mappedData[field] || mappedData[field].trim() === '');
    
    // Validate email
    if (data.email && data.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email.trim())) {
        return res.status(400).json({
          message: 'Invalid email format',
          errors: [{ field: 'email', message: 'Please provide a valid email address' }]
        });
      }
    } else {
      return res.status(400).json({
        message: 'Missing required fields: email',
        missingFields: ['email']
      });
    }
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields 
      });
    }

    if (existing) {
      // Update existing profile - preserve assignedCourses
      const assignedCourses = existing.assignedCourses || [];
      
      existing.fullName = mappedData.fullName;
      existing.profTitle = mappedData.profTitle;
      existing.phoneNumber = mappedData.phoneNumber;
      existing.location = mappedData.location;
      existing.aboutMe = mappedData.aboutMe;
      existing.education = mappedData.education;
      existing.experience = mappedData.experience;
      existing.certificatesCourses = mappedData.certificatesCourses;
      existing.assignedCourses = assignedCourses;

      await existing.save();

      res.status(200).json({
        message: "Teacher profile updated",
        teacher: existing
      });
    } else {
      // Create new profile
      const teacher = new Teacher({
        userId,
        ...mappedData
      });

      await teacher.save();

      res.status(201).json({
        message: "Teacher profile created",
        teacher
      });
    }

  } catch (error) {
    console.error("CREATE TEACHER ERROR:", error.message);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: "Validation error",
        errors: validationErrors 
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ message: "Teacher profile already exists for this user" });
    }
    
    res.status(500).json({ 
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ GET OWN TEACHER PROFILE - OPTIMIZED with lean()
exports.getMyTeacherProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const teacher = await Teacher.findOne({ userId })
      .populate("userId", "name email")
      .lean();

    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    res.json(teacher);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ GET PUBLIC TEACHER PROFILE BY ID (for students viewing teacher profiles)
exports.getTeacherProfileById = async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    let teacher = null;
    
    // Try to find by different ID formats
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    
    if (objectIdPattern.test(teacherId)) {
      // Try finding by teacher._id first
      teacher = await Teacher.findById(teacherId)
        .populate("userId", "name email")
        .lean();
      
      // If not found, try finding by userId
      if (!teacher) {
        const mongoose = require("mongoose");
        teacher = await Teacher.findOne({ userId: new mongoose.Types.ObjectId(teacherId) })
          .populate("userId", "name email")
          .lean();
      }
    }
    
    // Try finding by numeric ID in assignedCourses or other formats
    if (!teacher) {
      const numericId = parseInt(teacherId);
      if (!isNaN(numericId)) {
        // Look for teacher who created courses with this numeric ID
        const course = await Courses.findOne({ 
          $or: [
            { id: numericId },
            { _id: teacherId }
          ]
        }).lean();
        
        if (course && course.teacherId) {
          teacher = await Teacher.findById(course.teacherId)
            .populate("userId", "name email")
            .lean();
        }
      }
    }

    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    // Return public profile data (exclude sensitive info)
    const publicProfile = {
      _id: teacher._id,
      userId: teacher.userId?._id || teacher.userId,
      fullName: teacher.fullName,
      profTitle: teacher.profTitle,
      location: teacher.location,
      aboutMe: teacher.aboutMe,
      education: teacher.education || [],
      experience: teacher.experience || [],
      certificatesCourses: teacher.certificatesCourses || [],
      // Include user info if populated
      name: teacher.userId?.name || teacher.fullName,
      email: teacher.userId?.email || teacher.email
    };

    res.json({ teacher: publicProfile });
  } catch (error) {
    console.error("GET TEACHER PROFILE BY ID ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ ADD EDUCATION
exports.addEducation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const teacher = await Teacher.findOne({ userId });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    teacher.education.push(req.body);
    await teacher.save();

    res.json({ message: "Education added", teacher });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET EDUCATION
exports.getEducations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const teacher = await Teacher.findOne({ userId }).select('education').lean();
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json({ educations: teacher.education });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE EDUCATION
exports.updateEducation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { educationId } = req.params;
    const updates = req.body;

    const teacher = await Teacher.findOne({ userId });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const education = teacher.education.id(educationId);
    if (!education) {
      return res.status(404).json({ message: "Education field not found" });
    }
    Object.assign(education, updates);
    await teacher.save();

    res.json({ message: "Education field updated successfully", education });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE EDUCATION
exports.deleteEducation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { educationId } = req.params;

    const teacher = await Teacher.findOne({ userId });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    teacher.education = teacher.education.filter(
      (edu) => edu._id.toString() !== educationId);

    await teacher.save();

    res.json({ message: "Education Deleted successfully", teacher });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ ADD EXPERIENCE
exports.addExperience = async (req, res) => {
  try {
    const userId = req.user.userId;

    const teacher = await Teacher.findOne({ userId });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    teacher.experience.push(req.body);
    await teacher.save();

    res.json({ message: "Experience added", teacher });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET EXPERIENCES
exports.getExperiences = async (req, res) => {
  try {
    const userId = req.user.userId;
    const teacher = await Teacher.findOne({ userId }).select('experience').lean();
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json({ experiences: teacher.experience });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE EXPERIENCE
exports.updateExperience = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { experienceId } = req.params;
    const updates = req.body;

    const teacher = await Teacher.findOne({ userId });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const experience = teacher.experience.id(experienceId);
    if (!experience) {
      return res.status(404).json({ message: "Experience not found" });
    }

    Object.assign(experience, updates);
    await teacher.save();

    res.json({ message: "Experience updated successfully", experience });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE EXPERIENCE
exports.deleteExperience = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { experienceId } = req.params;

    const teacher = await Teacher.findOne({ userId });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    teacher.experience = teacher.experience.filter(
      (exp) => exp._id.toString() !== experienceId);

    await teacher.save();

    res.json({ message: "Experience Deleted successfully", teacher });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ ADD CERTIFICATE
exports.addCertificate = async (req, res) => {
  try {
    const userId = req.user.userId;

    const teacher = await Teacher.findOne({ userId });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    teacher.certificatesCourses.push(req.body);
    await teacher.save();

    res.json({ message: "Certificate added", teacher });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET CERTIFICATES 
exports.getCertificates = async (req, res) => {
  try {
    const userId = req.user.userId;
    const teacher = await Teacher.findOne({ userId }).select('certificatesCourses').lean();
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json({ certificates: teacher.certificatesCourses });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE CERTIFICATE
exports.updateCertificate = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { certificateId } = req.params;
    const updates = req.body;

    const teacher = await Teacher.findOne({ userId });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const certificate = teacher.certificatesCourses.id(certificateId);
    if (!certificate) {
      return res.status(404).json({ message: "Certificate field not found" });
    }
    Object.assign(certificate, updates);
    await teacher.save();

    res.json({ message: "Certificate field updated successfully", certificate });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE CERTIFICATE
exports.deleteCertificate = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { certificateId } = req.params;

    const teacher = await Teacher.findOne({ userId });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    teacher.certificatesCourses = teacher.certificatesCourses.filter(
      (cert) => cert._id.toString() !== certificateId);

    await teacher.save();

    res.json({ message: "Certificate Removed successfully", teacher });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET ALL STUDENTS FOR TEACHER (across all courses) - OPTIMIZED with batch queries
exports.getTeacherStudents = async (req, res) => {
  try {
    const userId = req.user.userId;
    const teacher = await Teacher.findOne({ userId }).lean();
    
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Get all courses where teacher is instructor
    const teacherCourses = await Courses.find({ teacherId: teacher._id }).select('_id').lean();
    const courseIds = teacherCourses.map(c => c._id);
    
    // Convert ObjectIds to strings for matching (since courseId in Enrollment is Mixed type)
    const courseIdStrings = courseIds.map(id => String(id));

    // Get all enrollments for these courses in ONE query
    // Handle Mixed type courseId: can be ObjectId or string
    // Query both ObjectId and string formats to ensure we catch all enrollments
    const enrollments = await Enrollment.find({
      $or: [
        { courseId: { $in: courseIds } }, // Match ObjectId format
        { courseId: { $in: courseIdStrings } } // Match string format
      ],
      status: "active"
    })
      .populate("studentId", "userId")
      .lean();
    
    // Manually populate courseId since it's Mixed type and populate might not work correctly
    const mongoose = require("mongoose");
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    
    // Separate ObjectIds from non-ObjectIds
    const enrollmentCourseIds = enrollments
      .map(e => e.courseId)
      .filter(id => id !== null && id !== undefined);
    
    const objectIdCourseIds = [];
    const nonObjectIdCourseIds = [];
    
    enrollmentCourseIds.forEach(id => {
      const idStr = String(id);
      if (objectIdPattern.test(idStr)) {
        try {
          objectIdCourseIds.push(new mongoose.Types.ObjectId(idStr));
        } catch (e) {
          // If conversion fails, treat as non-ObjectId
          nonObjectIdCourseIds.push(idStr);
        }
      } else {
        nonObjectIdCourseIds.push(idStr);
      }
    });
    
    // Get course details - query ObjectIds separately
    const courses = [];
    if (objectIdCourseIds.length > 0) {
      const objectIdCourses = await Courses.find({ _id: { $in: objectIdCourseIds } })
        .select('_id courseTitle')
        .lean();
      courses.push(...objectIdCourses);
    }
    
    // For non-ObjectId courseIds (default courses), they might not be in database
    // We'll handle them separately if needed
    
    const courseMap = new Map(courses.map(c => [String(c._id), c]));
    
    // Attach course info to enrollments
    enrollments.forEach(enrollment => {
      const courseIdStr = String(enrollment.courseId);
      const course = courseMap.get(courseIdStr);
      if (course) {
        enrollment.courseId = course;
      } else if (objectIdPattern.test(courseIdStr)) {
        // If it's an ObjectId but not found, create a minimal course object
        enrollment.courseId = {
          _id: courseIdStr,
          courseTitle: `Course ${courseIdStr.substring(0, 8)}...`
        };
      }
    });

    // Get unique student user IDs
    const studentUserIds = [...new Set(
      enrollments
        .filter(e => e.studentId && e.studentId.userId)
        .map(e => e.studentId.userId.toString())
    )];
    
    // BATCH QUERY: Get all users at once instead of N individual queries
    const users = await User.find({ _id: { $in: studentUserIds } }).select('name email').lean();
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    // Build student map with courses
    const studentMap = new Map();
    enrollments.forEach(enrollment => {
      if (!enrollment.studentId || !enrollment.studentId.userId) return;
      
      const studentUserId = enrollment.studentId.userId.toString();
      const user = userMap.get(studentUserId);
      
      if (!studentMap.has(studentUserId)) {
        studentMap.set(studentUserId, {
          studentId: enrollment.studentId._id,
          userId: studentUserId,
          name: user ? user.name : "Student",
          email: user ? user.email : "",
          courses: []
        });
      }
      
      const student = studentMap.get(studentUserId);
      if (enrollment.courseId) {
        student.courses.push({
          courseId: enrollment.courseId._id,
          courseTitle: enrollment.courseId.courseTitle,
          progress: enrollment.progress,
          enrolledDate: enrollment.enrolledDate
        });
      }
    });

    const students = Array.from(studentMap.values());
    res.json({ students });
  } catch (error) {
    console.error("GET TEACHER STUDENTS ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE STUDENT PROGRESS (for teachers to manage student progress) - OPTIMIZED
exports.updateStudentProgress = async (req, res) => {
  try {
    console.log("UPDATE STUDENT PROGRESS - Received request:");
    console.log("  Params:", req.params);
    console.log("  Body:", req.body);
    
    const userId = req.user.userId;
    const { courseId, studentId } = req.params;
    const { progress, currentSection, completedSections } = req.body;

    const teacher = await Teacher.findOne({ userId }).lean();
    if (!teacher) {
      return res.status(403).json({ message: "Only teachers allowed" });
    }

    const courseIdStr = String(courseId);
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    const isObjectId = objectIdPattern.test(courseIdStr);
    const courseIdForQuery = isObjectId ? new mongoose.Types.ObjectId(courseIdStr) : courseIdStr;

    // Check if teacher has access to this course
    let hasAccess = false;

    if (isObjectId) {
      const course = await Courses.findOne({ _id: courseIdForQuery, teacherId: teacher._id }).select('_id').lean();
      if (course) hasAccess = true;
    }

    if (!hasAccess) {
      const assignedCourses = teacher.assignedCourses || [];
      const numericCourseId = isNaN(parseInt(courseIdStr)) ? null : parseInt(courseIdStr);
      hasAccess = assignedCourses.some(assignedId => {
        const assignedIdStr = String(assignedId);
        return assignedIdStr === courseIdStr || (numericCourseId !== null && assignedId === numericCourseId);
      });
    }

    if (!hasAccess) {
      return res.status(404).json({ message: "Course not found or access denied" });
    }

    const studentIdPattern = /^[0-9a-fA-F]{24}$/;
    if (!studentIdPattern.test(String(studentId))) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    // Build enrollment query - include both active and completed students
    // Handle Mixed type courseId: can be ObjectId or string
    let enrollmentQuery = {
      studentId: new mongoose.Types.ObjectId(studentId),
      status: { $in: ["active", "completed"] }
    };

    if (isObjectId) {
      // Query both ObjectId and string formats to handle Mixed type
      enrollmentQuery.$or = [
        { courseId: courseIdForQuery }, // Match ObjectId format
        { courseId: courseIdStr } // Match string format
      ];
    } else {
      const numericCourseId = isNaN(parseInt(courseIdStr)) ? null : parseInt(courseIdStr);
      if (numericCourseId !== null) {
        enrollmentQuery.$or = [
          { courseId: courseIdStr },
          { courseId: numericCourseId }
        ];
      } else {
        enrollmentQuery.courseId = courseIdStr;
      }
    }

    console.log("  Enrollment query:", JSON.stringify(enrollmentQuery, null, 2));
    const enrollment = await Enrollment.findOne(enrollmentQuery);
    console.log("  Found enrollment:", enrollment ? enrollment._id : "null");
    if (!enrollment) {
      return res.status(404).json({ message: "Student enrollment not found" });
    }

    // Track previous progress to detect completion
    const previousProgress = enrollment.progress || 0;
    const wasCompleted = enrollment.isCompleted || previousProgress >= 100;

    // Update the enrollment
    if (progress !== undefined) {
      enrollment.progress = Math.min(100, Math.max(0, progress));
    }
    if (currentSection !== undefined) {
      enrollment.currentSection = currentSection;
    }
    if (completedSections !== undefined) {
      enrollment.completedSections = completedSections;
    }
    
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
        const Notification = require("../models/Notification");
        const User = require("../models/User");
        const Student = require("../models/Student");
        
        // Get student user ID
        const student = await Student.findById(enrollment.studentId).select('userId').lean();
        if (!student || !student.userId) {
          console.warn("Could not create completion notification: Student user not found");
        } else {
          // Get course title
          const getCourseTitle = async (courseId) => {
            try {
              if (isObjectId) {
                const course = await Courses.findOne({ _id: courseId }).select('courseTitle').lean();
                if (course?.courseTitle) return course.courseTitle;
              } else {
                const course = await Courses.findOne({ courseId: courseIdStr }).select('courseTitle').lean();
                if (course?.courseTitle) return course.courseTitle;
              }
              return `Course ${courseIdStr}`;
            } catch (error) {
              console.error("Error getting course title:", error.message);
              return `Course ${courseIdStr}`;
            }
          };
          
          const courseTitle = await getCourseTitle(enrollment.courseId);
          
          // Get student name and email
          const studentUser = await User.findById(student.userId).select('name email').lean();
          const studentName = studentUser?.name || "Student";
          const studentEmail = studentUser?.email || "";
          
          // Use current teacher as sender
          const teacherId = teacher._id;
          
          // Create notification for student
          const notification = new Notification({
            receiverId: student.userId,
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
          try {
            const Admin = require("../models/Admin");
            const [adminUsers, adminRecords] = await Promise.all([
              User.find({ userType: "admin" }).select('_id').lean(),
              Admin.find({}).lean()
            ]);
            
            const adminTypeMap = new Map(adminRecords.map(a => [a.userId.toString(), a.adminType]));
            const generalAdmins = adminUsers.filter(admin => {
              const adminType = adminTypeMap.get(admin._id.toString());
              return adminType === "general" || adminType === undefined;
            });
            
            if (generalAdmins.length > 0) {
              const adminNotifications = generalAdmins.map(admin => ({
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
              
              await Notification.insertMany(adminNotifications);
              console.log(`Certificate notifications created for ${generalAdmins.length} general admin(s)`);
            }
          } catch (adminNotifyError) {
            console.error("Error notifying general admins for certificate:", adminNotifyError.message);
          }
        }
      } catch (notificationError) {
        // Don't fail the progress update if notification fails
        console.error("Error creating completion notification:", notificationError.message);
      }
    }

    res.json({ 
      success: true, 
      message: "Student progress updated",
      enrollment: {
        _id: enrollment._id,
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        progress: enrollment.progress,
        completedSections: enrollment.completedSections,
        currentSection: enrollment.currentSection,
        isCompleted: enrollment.isCompleted
      },
      isCompleted: justCompleted
    });
  } catch (error) {
    console.error("UPDATE STUDENT PROGRESS ERROR:", error.message);
    console.error("Full error:", error);
    console.error("Stack:", error.stack);
    console.error("Params:", { courseId: req.params.courseId, studentId: req.params.studentId });
    console.error("Body:", req.body);
    res.status(500).json({ message: "Server error", debug: error.message });
  }
};

// GET STUDENT PROGRESS (for teachers to view student progress) - OPTIMIZED
exports.getStudentProgress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId, studentId } = req.params;

    const teacher = await Teacher.findOne({ userId }).lean();
    if (!teacher) {
      return res.status(403).json({ message: "Only teachers allowed" });
    }

    const courseIdStr = String(courseId);
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    const isObjectId = objectIdPattern.test(courseIdStr);
    const courseIdForQuery = isObjectId ? new mongoose.Types.ObjectId(courseIdStr) : courseIdStr;

    // Check if teacher has access to this course
    let hasAccess = false;

    if (isObjectId) {
      const course = await Courses.findOne({ _id: courseIdForQuery, teacherId: teacher._id }).select('_id').lean();
      if (course) hasAccess = true;
    }

    if (!hasAccess) {
      const assignedCourses = teacher.assignedCourses || [];
      const numericCourseId = isNaN(parseInt(courseIdStr)) ? null : parseInt(courseIdStr);
      hasAccess = assignedCourses.some(assignedId => {
        const assignedIdStr = String(assignedId);
        return assignedIdStr === courseIdStr || (numericCourseId !== null && assignedId === numericCourseId);
      });
    }

    if (!hasAccess) {
      return res.status(404).json({ message: "Course not found or access denied" });
    }

    const studentIdPattern = /^[0-9a-fA-F]{24}$/;
    if (!studentIdPattern.test(String(studentId))) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    // Build enrollment query
    // Handle Mixed type courseId: can be ObjectId or string
    let enrollmentQuery = {
      studentId: new mongoose.Types.ObjectId(studentId),
      status: { $in: ["active", "completed"] }
    };

    if (isObjectId) {
      // Query both ObjectId and string formats to handle Mixed type
      enrollmentQuery.$or = [
        { courseId: courseIdForQuery }, // Match ObjectId format
        { courseId: courseIdStr } // Match string format
      ];
    } else {
      const numericCourseId = isNaN(parseInt(courseIdStr)) ? null : parseInt(courseIdStr);
      if (numericCourseId !== null) {
        enrollmentQuery.$or = [
          { courseId: courseIdStr },
          { courseId: numericCourseId }
        ];
      } else {
        enrollmentQuery.courseId = courseIdStr;
      }
    }

    const enrollment = await Enrollment.findOne(enrollmentQuery).lean();
    if (!enrollment) {
      return res.status(404).json({ message: "Student enrollment not found" });
    }

    res.json({ 
      success: true,
      progress: {
        enrollmentId: enrollment._id,
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        progress: enrollment.progress || 0,
        completedSections: enrollment.completedSections || [],
        currentSection: enrollment.currentSection,
        isCompleted: enrollment.isCompleted || false
      }
    });
  } catch (error) {
    console.error("GET STUDENT PROGRESS ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// GET STUDENTS FOR A SPECIFIC COURSE - OPTIMIZED with batch queries
exports.getCourseStudents = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.params;

    const teacher = await Teacher.findOne({ userId }).lean();
    if (!teacher) {
      return res.status(403).json({ message: "Only teachers allowed" });
    }

    const courseIdStr = String(courseId);
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    const isObjectId = objectIdPattern.test(courseIdStr);
    const courseIdForQuery = isObjectId ? new mongoose.Types.ObjectId(courseIdStr) : courseIdStr;

    // Check if teacher has access to this course
    let hasAccess = false;

    if (isObjectId) {
      const course = await Courses.findOne({ _id: courseIdForQuery, teacherId: teacher._id }).select('_id').lean();
      if (course) hasAccess = true;
    }

    if (!hasAccess) {
      const assignedCourses = teacher.assignedCourses || [];
      const numericCourseId = isNaN(parseInt(courseIdStr)) ? null : parseInt(courseIdStr);
      hasAccess = assignedCourses.some(assignedId => {
        const assignedIdStr = String(assignedId);
        return assignedIdStr === courseIdStr || (numericCourseId !== null && assignedId === numericCourseId);
      });
    }

    if (!hasAccess) {
      return res.status(404).json({ message: "Course not found or access denied" });
    }

    // Build enrollment query
    // Handle Mixed type courseId: can be ObjectId or string
    let enrollmentQuery = {
      status: { $in: ["active", "completed"] }
    };

    if (isObjectId) {
      // Query both ObjectId and string formats to handle Mixed type
      enrollmentQuery.$or = [
        { courseId: courseIdForQuery }, // Match ObjectId format
        { courseId: courseIdStr } // Match string format
      ];
    } else {
      const numericCourseId = isNaN(parseInt(courseIdStr)) ? null : parseInt(courseIdStr);
      if (numericCourseId !== null) {
        enrollmentQuery.$or = [
          { courseId: courseIdStr },
          { courseId: numericCourseId }
        ];
      } else {
        enrollmentQuery.courseId = courseIdStr;
      }
    }

    const enrollments = await Enrollment.find(enrollmentQuery)
      .populate("studentId", "userId")
      .sort({ createdAt: -1 })
      .lean();

    // BATCH QUERY: Get all user IDs and fetch users in ONE query
    const userIds = enrollments
      .filter(e => e.studentId && e.studentId.userId)
      .map(e => e.studentId.userId);
    
    const users = await User.find({ _id: { $in: userIds } }).select('name email').lean();
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    // Build student list using the user map (no N+1 queries!)
    const students = enrollments
      .filter(e => e.studentId && e.studentId.userId)
      .map(enrollment => {
        const user = userMap.get(enrollment.studentId.userId.toString());
        return {
          studentId: enrollment.studentId._id,
          userId: enrollment.studentId.userId,
          name: user ? user.name : "Student",
          email: user ? user.email : "",
          courseId: enrollment.courseId,
          enrolledDate: enrollment.enrolledDate,
          enrollmentStatus: enrollment.status,
          progress: enrollment.progress || 0,
          isCompleted: enrollment.isCompleted || enrollment.progress >= 100,
          currentSection: enrollment.currentSection,
          completedSections: enrollment.completedSections || []
        };
      });

    res.json({ students });
  } catch (error) {
    console.error("GET COURSE STUDENTS ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
