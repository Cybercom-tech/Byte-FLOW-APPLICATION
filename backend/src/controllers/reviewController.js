const Review = require("../models/Review");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const Enrollment = require("../models/Enrollment");
const Courses = require("../models/Courses");
const User = require("../models/User");
const mongoose = require("mongoose");

// ✅ CREATE A REVIEW (Student only, must have completed the course)
exports.createReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { teacherId, courseId, rating, reviewText } = req.body;

    // Validate required fields
    if (!teacherId || !courseId || !rating || !reviewText) {
      return res.status(400).json({ 
        message: "Missing required fields: teacherId, courseId, rating, and reviewText are required" 
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Find the student
    const student = await Student.findOne({ userId }).lean();
    if (!student) {
      return res.status(403).json({ message: "Only students can write reviews" });
    }

    // Find the teacher
    let teacher = null;
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    
    if (objectIdPattern.test(String(teacherId))) {
      teacher = await Teacher.findById(teacherId).lean();
      if (!teacher) {
        teacher = await Teacher.findOne({ userId: new mongoose.Types.ObjectId(teacherId) }).lean();
      }
    }

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Check if student has completed this specific course (100% progress)
    // Enrollment stores courseId as string for both default and DB courses (from req.body), so match both ObjectId and string
    const courseIdStr = String(courseId);
    const isObjectId = objectIdPattern.test(courseIdStr);
    
    let enrollmentQuery = {
      studentId: student._id,
      status: "active",
      progress: { $gte: 100 }
    };

    // Handle ObjectId (DB/admin courses stored as string), numeric (default), and string IDs
    if (isObjectId) {
      enrollmentQuery.$or = [
        { courseId: new mongoose.Types.ObjectId(courseIdStr) },
        { courseId: courseIdStr }
      ];
      delete enrollmentQuery.courseId;
    } else {
      const numericCourseId = parseInt(courseIdStr);
      if (!isNaN(numericCourseId)) {
        enrollmentQuery.$or = [
          { courseId: courseIdStr },
          { courseId: numericCourseId }
        ];
        delete enrollmentQuery.courseId;
      } else {
        enrollmentQuery.courseId = courseIdStr;
      }
    }

    const completedEnrollment = await Enrollment.findOne(enrollmentQuery).lean();
    
    if (!completedEnrollment) {
      return res.status(403).json({ 
        message: "You can only review a course you have completed (100% progress)" 
      });
    }

    // Verify the course belongs to this teacher
    let courseTeacherId = null;
    
    if (isObjectId) {
      const course = await Courses.findById(courseIdStr).lean();
      if (course) {
        courseTeacherId = course.teacherId;
      }
    }

    // For static courses, we trust the frontend's teacherId validation
    // since static courses don't have a database entry

    if (courseTeacherId && String(courseTeacherId) !== String(teacher._id)) {
      return res.status(403).json({ 
        message: "This course is not taught by this teacher" 
      });
    }

    // Check if review already exists for this student-teacher-course combination
    const existingReview = await Review.findOne({
      teacherId: teacher._id,
      studentId: student._id,
      courseId: courseId
    }).lean();

    if (existingReview) {
      return res.status(400).json({ 
        message: "You have already reviewed this course. You can update your existing review instead." 
      });
    }

    // Create the review
    const review = new Review({
      teacherId: teacher._id,
      studentId: student._id,
      courseId: courseId,
      rating: rating,
      reviewText: reviewText.trim()
    });

    await review.save();

    // Get student's user info for the response
    const user = await User.findById(userId).select("name").lean();

    res.status(201).json({
      message: "Review submitted successfully",
      review: {
        _id: review._id,
        teacherId: review.teacherId,
        studentId: review.studentId,
        courseId: review.courseId,
        rating: review.rating,
        reviewText: review.reviewText,
        createdAt: review.createdAt,
        studentName: user?.name || "Student"
      }
    });
  } catch (error) {
    console.error("CREATE REVIEW ERROR:", error.message);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "You have already reviewed this course" 
      });
    }
    
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ GET REVIEWS FOR A TEACHER (Public - no auth required)
exports.getTeacherReviews = async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    // Find the teacher
    let teacher = null;
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    
    if (objectIdPattern.test(String(teacherId))) {
      teacher = await Teacher.findById(teacherId).lean();
      if (!teacher) {
        teacher = await Teacher.findOne({ userId: new mongoose.Types.ObjectId(teacherId) }).lean();
      }
    }

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Get all active reviews for this teacher
    const reviews = await Review.find({ 
      teacherId: teacher._id, 
      status: "active" 
    })
      .sort({ createdAt: -1 })
      .lean();

    // Get student user IDs for names
    const studentIds = [...new Set(reviews.map(r => r.studentId.toString()))];
    const students = await Student.find({ 
      _id: { $in: studentIds.map(id => new mongoose.Types.ObjectId(id)) } 
    }).lean();
    
    const studentUserIds = students.map(s => s.userId);
    const users = await User.find({ _id: { $in: studentUserIds } }).select("name").lean();
    
    // Create a map of studentId -> userName
    const studentUserMap = new Map();
    students.forEach(student => {
      const user = users.find(u => String(u._id) === String(student.userId));
      studentUserMap.set(String(student._id), user?.name || "Student");
    });

    // Get course information for each review
    const courseIds = [...new Set(reviews.map(r => r.courseId))];
    const objectIdCourseIds = courseIds.filter(id => objectIdPattern.test(String(id)));
    
    const courses = objectIdCourseIds.length > 0 
      ? await Courses.find({ 
          _id: { $in: objectIdCourseIds.map(id => new mongoose.Types.ObjectId(id)) } 
        }).select("courseTitle").lean()
      : [];
    
    const courseMap = new Map(courses.map(c => [String(c._id), c.courseTitle]));

    // Build response with student names and course titles
    const reviewsWithDetails = reviews.map(review => ({
      _id: review._id,
      teacherId: review.teacherId,
      courseId: review.courseId,
      courseName: courseMap.get(String(review.courseId)) || null, // Will be null for static courses
      rating: review.rating,
      reviewText: review.reviewText,
      createdAt: review.createdAt,
      studentName: studentUserMap.get(String(review.studentId)) || "Student"
    }));

    // Calculate average rating
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    res.json({
      reviews: reviewsWithDetails,
      totalReviews: reviews.length,
      averageRating: Math.round(averageRating * 10) / 10
    });
  } catch (error) {
    console.error("GET TEACHER REVIEWS ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ GET STUDENT'S REVIEWS (for the logged-in student)
exports.getMyReviews = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const student = await Student.findOne({ userId }).lean();
    if (!student) {
      return res.status(403).json({ message: "Only students can access this" });
    }

    const reviews = await Review.find({ studentId: student._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ reviews });
  } catch (error) {
    console.error("GET MY REVIEWS ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ CHECK IF STUDENT CAN REVIEW A SPECIFIC COURSE
exports.canReviewCourse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { teacherId, courseId } = req.params;

    const student = await Student.findOne({ userId }).lean();
    if (!student) {
      return res.json({ canReview: false, reason: "Not a student" });
    }

    // Find the teacher
    let teacher = null;
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    
    if (objectIdPattern.test(String(teacherId))) {
      teacher = await Teacher.findById(teacherId).lean();
      if (!teacher) {
        teacher = await Teacher.findOne({ userId: new mongoose.Types.ObjectId(teacherId) }).lean();
      }
    }

    if (!teacher) {
      return res.json({ canReview: false, reason: "Teacher not found" });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({
      teacherId: teacher._id,
      studentId: student._id,
      courseId: courseId
    }).lean();

    if (existingReview) {
      return res.json({ 
        canReview: false, 
        reason: "Already reviewed",
        existingReview: existingReview
      });
    }

    // Check if course is completed (enrollment stores courseId as string for DB courses from frontend)
    const courseIdStr = String(courseId);
    const isObjectId = objectIdPattern.test(courseIdStr);
    
    let enrollmentQuery = {
      studentId: student._id,
      status: "active",
      progress: { $gte: 100 }
    };

    if (isObjectId) {
      enrollmentQuery.$or = [
        { courseId: new mongoose.Types.ObjectId(courseIdStr) },
        { courseId: courseIdStr }
      ];
      delete enrollmentQuery.courseId;
    } else {
      const numericCourseId = parseInt(courseIdStr);
      if (!isNaN(numericCourseId)) {
        enrollmentQuery.$or = [
          { courseId: courseIdStr },
          { courseId: numericCourseId }
        ];
        delete enrollmentQuery.courseId;
      } else {
        enrollmentQuery.courseId = courseIdStr;
      }
    }

    const completedEnrollment = await Enrollment.findOne(enrollmentQuery).lean();

    if (!completedEnrollment) {
      return res.json({ 
        canReview: false, 
        reason: "Course not completed",
        progress: 0
      });
    }

    res.json({ 
      canReview: true,
      reason: "Course completed, ready to review"
    });
  } catch (error) {
    console.error("CAN REVIEW COURSE ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ GET COMPLETED COURSES FOR REVIEW (by a student for a specific teacher)
exports.getCompletedCoursesForReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { teacherId } = req.params;

    const student = await Student.findOne({ userId }).lean();
    if (!student) {
      return res.status(403).json({ message: "Only students can access this" });
    }

    // Find the teacher
    let teacher = null;
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    
    if (objectIdPattern.test(String(teacherId))) {
      teacher = await Teacher.findById(teacherId).lean();
      if (!teacher) {
        teacher = await Teacher.findOne({ userId: new mongoose.Types.ObjectId(teacherId) }).lean();
      }
    }

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Get all teacher's courses (created by teacher or admin-assigned with this teacherId)
    const teacherCourses = await Courses.find({ teacherId: teacher._id })
      .select("_id courseTitle")
      .lean();
    const teacherCourseIds = teacherCourses.map(c => c._id);

    // Also get static course assignments (default course ids like "1", "2")
    const assignedCourseIds = (teacher.assignedCourses || []).map(id => String(id));

    // Get student's completed enrollments
    const completedEnrollments = await Enrollment.find({
      studentId: student._id,
      status: "active",
      progress: { $gte: 100 }
    }).lean();

    // Filter to only courses by this teacher (DB courses by teacherId or static assigned)
    const completedTeacherCourses = completedEnrollments.filter(enrollment => {
      const enrolledCourseId = String(enrollment.courseId);
      const isDbCourse = teacherCourseIds.some(id => String(id) === enrolledCourseId);
      const isAssignedCourse = assignedCourseIds.some(id => id === enrolledCourseId);
      return isDbCourse || isAssignedCourse;
    });

    // Course IDs that are ObjectIds (DB courses) but not in teacherCourses - need title lookup
    const dbCourseIdsForLookup = [...new Set(
      completedTeacherCourses
        .map(e => String(e.courseId))
        .filter(id => objectIdPattern.test(id))
    )];
    const extraCourses = dbCourseIdsForLookup.length > 0
      ? await Courses.find({
          _id: { $in: dbCourseIdsForLookup.map(id => new mongoose.Types.ObjectId(id)) }
        })
        .select("_id courseTitle")
        .lean()
      : [];
    const courseTitleById = new Map(extraCourses.map(c => [String(c._id), c.courseTitle]));
    teacherCourses.forEach(c => courseTitleById.set(String(c._id), c.courseTitle));

    // Get existing reviews by this student for this teacher
    const existingReviews = await Review.find({
      teacherId: teacher._id,
      studentId: student._id
    }).lean();

    const reviewedCourseIds = existingReviews.map(r => String(r.courseId));

    // Build the response with course details and review status (same shape for default and DB courses)
    const coursesForReview = completedTeacherCourses.map(enrollment => {
      const courseIdStr = String(enrollment.courseId);
      const dbCourse = teacherCourses.find(c => String(c._id) === courseIdStr);
      const titleFromDb = courseTitleById.get(courseIdStr) || dbCourse?.courseTitle;
      const existingReview = existingReviews.find(r => String(r.courseId) === courseIdStr);

      return {
        courseId: enrollment.courseId,
        courseTitle: titleFromDb || null, // DB and admin courses from Courses; static from frontend
        progress: enrollment.progress,
        completedAt: enrollment.updatedAt,
        hasReviewed: reviewedCourseIds.includes(courseIdStr),
        existingReview: existingReview || null
      };
    });

    res.json({ 
      courses: coursesForReview,
      totalCompleted: coursesForReview.length,
      totalReviewed: coursesForReview.filter(c => c.hasReviewed).length
    });
  } catch (error) {
    console.error("GET COMPLETED COURSES FOR REVIEW ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ UPDATE A REVIEW
exports.updateReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reviewId } = req.params;
    const { rating, reviewText } = req.body;

    const student = await Student.findOne({ userId }).lean();
    if (!student) {
      return res.status(403).json({ message: "Only students can update reviews" });
    }

    const review = await Review.findOne({
      _id: reviewId,
      studentId: student._id
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found or not yours" });
    }

    // Update fields
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      review.rating = rating;
    }

    if (reviewText !== undefined) {
      review.reviewText = reviewText.trim();
    }

    await review.save();

    res.json({
      message: "Review updated successfully",
      review: review
    });
  } catch (error) {
    console.error("UPDATE REVIEW ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ DELETE A REVIEW
exports.deleteReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reviewId } = req.params;

    const student = await Student.findOne({ userId }).lean();
    if (!student) {
      return res.status(403).json({ message: "Only students can delete reviews" });
    }

    const review = await Review.findOneAndDelete({
      _id: reviewId,
      studentId: student._id
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found or not yours" });
    }

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("DELETE REVIEW ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

