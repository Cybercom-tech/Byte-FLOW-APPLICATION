const Courses = require("../models/Courses");
const Teacher = require("../models/Teacher");
const User = require("../models/User");
const Notification = require("../models/Notification");
const Admin = require("../models/Admin");

// ✅ CREATE COURSE
exports.createCourse = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check if this user is a teacher or a general admin
    const [teacher, user, admin] = await Promise.all([
      Teacher.findOne({ userId }).lean(),
      User.findById(userId).select('userType').lean(),
      Admin.findOne({ userId }).lean()
    ]);
    
    // Allow teachers and general admins to create courses
    const isTeacher = !!teacher;
    const isGeneralAdmin = user?.userType === 'admin' && (admin?.adminType === 'general' || !admin);
    
    if (!isTeacher && !isGeneralAdmin) {
      return res.status(403).json({ message: "Only teachers and general admins can create courses" });
    }

    const data = req.body;
    console.log("CREATE COURSE - Received data:", JSON.stringify(data, null, 2));
    
    // Normalize category values to match backend enum
    const normalizeCategory = (cat) => {
      if (!cat) return cat;
      const categoryMap = {
        'Artificial Intelligence': 'Artificial Intelligence (AI)',
        'AI': 'Artificial Intelligence (AI)',
        'Data Science': 'Data Science',
        'Web Development': 'Web Development',
        'Mobile Development': 'Mobile Development',
        'Programming': 'Programming',
        'Cloud Computing': 'Cloud Computing',
        'Cyber Security': 'Cyber Security',
        'Design': 'Design',
        'Database': 'Database',
        'DevOps': 'DevOps',
        'Management': 'Management',
        'Managment': 'Management', // Handle typo in enum
        'Marketing': 'Marketing',
        'Animation & VR': 'Animation & VR'
      };
      return categoryMap[cat] || cat;
    };
    
    // Map frontend field names to backend model field names
    const mappedData = {
      courseTitle: data.title || data.courseTitle || '',
      shortDescription: data.description || data.shortDescription || '',
      longDescription: data.fullDescription || data.longDescription || data.description || '',
      courseCategories: Array.isArray(data.category) && data.category.length > 0 
        ? data.category.map(normalizeCategory)
        : (data.category ? [normalizeCategory(data.category)] : (Array.isArray(data.courseCategories) && data.courseCategories.length > 0 ? data.courseCategories.map(normalizeCategory) : [])),
      courseLevel: Array.isArray(data.level) && data.level.length > 0
        ? data.level
        : (data.level ? [data.level] : (Array.isArray(data.courseLevel) && data.courseLevel.length > 0 ? data.courseLevel : ['Beginner'])),
      totalPriceOfCourse: data.price || data.totalPriceOfCourse || 0,
      originalPriceOfCourse: data.originalPrice || data.originalPriceOfCourse || data.price || 0,
      courseImage: data.image || data.courseImage || '',
      learningOutcomeOfCourse: Array.isArray(data.learnings) ? data.learnings.filter(l => l && l.trim() !== '') : (data.learningOutcomeOfCourse || []),
      requirements: Array.isArray(data.requirements) ? data.requirements.filter(r => r && r.trim() !== '') : (data.requirements || []),
      contentOfCourse: Array.isArray(data.sections) && data.sections.length > 0 
        ? data.sections.map(section => {
            if (Array.isArray(section.items) && section.items.length > 0) {
              const topicTitles = section.items.map(item => item.title || item.topicTitle || '').filter(Boolean);
              const estimatedTimes = section.items.map(item => item.duration || item.estimatedTime || '0 min').filter(Boolean);
              return {
                sectionTitle: section.title || section.sectionTitle || '',
                topicTitle: topicTitles.join(', ') || '',
                estimatedTime: estimatedTimes.join(', ') || '0 min'
              };
            } else {
              return {
                sectionTitle: section.title || section.sectionTitle || '',
                topicTitle: section.topicTitle || section.title || '',
                estimatedTime: section.duration || section.estimatedTime || '0 min'
              };
            }
          })
        : (data.contentOfCourse || []),
      // Only set teacherId if teacher exists, otherwise omit it (schema allows null/undefined)
      ...(isTeacher && teacher ? { teacherId: teacher._id } : {}),
      isApproved: isGeneralAdmin ? true : false // Auto-approve admin-created courses
    };

    console.log("CREATE COURSE - Mapped data:", JSON.stringify(mappedData, null, 2));
    console.log("CREATE COURSE - isTeacher:", isTeacher, "isGeneralAdmin:", isGeneralAdmin);

    // Validate required fields
    const requiredFields = ['courseTitle', 'shortDescription', 'longDescription', 'originalPriceOfCourse', 'courseImage'];
    const missingFields = requiredFields.filter(field => {
      const value = mappedData[field];
      if (value === undefined || value === null) return true;
      if (typeof value === 'string' && value.trim() === '') return true;
      if (typeof value === 'number' && isNaN(value)) return true;
      return false;
    });
    
    if (!Array.isArray(mappedData.learningOutcomeOfCourse) || mappedData.learningOutcomeOfCourse.length === 0) {
      missingFields.push('learningOutcomeOfCourse (learnings)');
    }
    if (!Array.isArray(mappedData.requirements) || mappedData.requirements.length === 0) {
      missingFields.push('requirements');
    }
    if (!Array.isArray(mappedData.contentOfCourse) || mappedData.contentOfCourse.length === 0) {
      missingFields.push('contentOfCourse (sections)');
    }
    if (!Array.isArray(mappedData.courseCategories) || mappedData.courseCategories.length === 0) {
      missingFields.push('courseCategories (category)');
    }
    if (!Array.isArray(mappedData.courseLevel) || mappedData.courseLevel.length === 0) {
      missingFields.push('courseLevel (level)');
    }
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields 
      });
    }

    // Create and save course
    const course = new Courses(mappedData);
    await course.save();

    // Notify general admins about the new course submission (only for teacher-created courses)
    if (isTeacher && !isGeneralAdmin) {
      try {
        const [adminUsers, adminRecords] = await Promise.all([
          User.find({ userType: "admin" }).select('_id').lean(),
          Admin.find({}).lean()
        ]);
        
        const adminTypeMap = new Map(adminRecords.map(a => [a.userId.toString(), a.adminType]));
        
        const generalAdmins = adminUsers.filter(admin => {
          const adminType = adminTypeMap.get(admin._id.toString());
          return adminType === "general" || adminType === undefined;
        });
        
        const teacherName = teacher.fullName || teacher.profTitle || "A teacher";
        
        if (generalAdmins.length > 0) {
          const notifications = generalAdmins.map(admin => ({
            receiverId: admin._id,
            senderId: teacher._id,
            type: "course_submitted",
            message: `New course "${mappedData.courseTitle}" submitted by ${teacherName} for approval.`
          }));
          await Notification.insertMany(notifications);
        }
      } catch (notificationError) {
        console.error("Error creating admin notifications:", notificationError.message);
      }
    }

    res.status(201).json({
      message: "Course created successfully. Waiting for admin approval.",
      course
    });

  } catch (error) {
    console.error("CREATE COURSE ERROR:", error.message);
    console.error("CREATE COURSE ERROR STACK:", error.stack);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors || {}).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      console.error("Validation errors:", validationErrors);
      return res.status(400).json({
        message: 'Validation error',
        errors: validationErrors,
        errorDetails: error.errors
      });
    }
    
    res.status(500).json({ 
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET ALL COURSES - OPTIMIZED with lean()
exports.getAllCourses = async (req, res) => {
  try {
    const { includePending } = req.query;
    const query = includePending === "true" ? {} : { isApproved: true };
    const courses = await Courses.find(query)
      .populate("teacherId", "fullName profTitle")
      .lean();
    res.json({ courses });
  } catch (error) {
    console.error("GET ALL COURSES ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// GET SINGLE COURSE BY ID - OPTIMIZED
exports.getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    if (!objectIdPattern.test(courseId)) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    const course = await Courses.findById(courseId)
      .populate("teacherId", "fullName profTitle")
      .lean();
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({ course });
  } catch (error) {
    console.error("GET COURSE ERROR:", error.message);
    
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(404).json({ message: "Course not found" });
    }
    
    res.status(500).json({ 
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET COURSE INSTRUCTOR - OPTIMIZED
exports.getCourseInstructor = async (req, res) => {
  try {
    const { courseId } = req.params;
    const courseIdStr = String(courseId);
    
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    const isObjectId = objectIdPattern.test(courseIdStr);
    
    let instructor = null;
    
    if (isObjectId) {
      const course = await Courses.findById(courseIdStr)
        .populate("teacherId", "fullName profTitle")
        .select("teacherId")
        .lean();
      if (course && course.teacherId) {
        instructor = {
          id: course.teacherId._id || course.teacherId,
          name: course.teacherId.fullName || course.teacherId,
          title: course.teacherId.profTitle || null
        };
      }
    }
    
    // Check assigned courses if no instructor found
    if (!instructor) {
      const numericCourseId = isNaN(parseInt(courseIdStr)) ? null : parseInt(courseIdStr);
      
      let query;
      if (isObjectId) {
        query = { assignedCourses: courseIdStr };
      } else if (numericCourseId !== null) {
        query = { $or: [{ assignedCourses: courseIdStr }, { assignedCourses: numericCourseId }] };
      } else {
        query = { assignedCourses: courseIdStr };
      }
      
      const teacher = await Teacher.findOne(query).select("fullName profTitle _id").lean();
      
      if (teacher) {
        instructor = {
          id: teacher._id,
          name: teacher.fullName,
          title: teacher.profTitle || null
        };
      }
    }
    
    res.json({ instructor });
  } catch (error) {
    console.error("GET COURSE INSTRUCTOR ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// GET TEACHER STATS (PUBLIC) - For viewing teacher statistics (student count, etc.)
exports.getTeacherStats = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const Enrollment = require("../models/Enrollment");
    const mongoose = require("mongoose");
    
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

    // Get all courses by this teacher
    const assignedCourseIds = teacher.assignedCourses || [];
    const mongoObjectIds = [];
    const numericIds = [];
    
    for (const courseId of assignedCourseIds) {
      const courseIdStr = String(courseId);
      if (objectIdPattern.test(courseIdStr)) {
        mongoObjectIds.push(courseIdStr);
      } else {
        numericIds.push(courseIdStr);
      }
    }
    
    // Get created courses
    const createdCourses = await Courses.find({ teacherId: teacher._id }).select('_id').lean();
    const createdCourseIds = createdCourses.map(c => c._id);
    
    // Build list of all course IDs
    const allCourseIds = [
      ...createdCourseIds,
      ...mongoObjectIds.map(id => new mongoose.Types.ObjectId(id))
    ];
    
    // Count unique students enrolled in any of these courses
    let studentCount = 0;
    
    if (allCourseIds.length > 0 || numericIds.length > 0) {
      // Build query for enrollments
      const enrollmentQuery = {
        status: { $in: ["active", "completed"] }
      };
      
      if (allCourseIds.length > 0 && numericIds.length > 0) {
        enrollmentQuery.$or = [
          { courseId: { $in: allCourseIds } },
          { courseId: { $in: numericIds } },
          { courseId: { $in: numericIds.map(id => parseInt(id)) } }
        ];
      } else if (allCourseIds.length > 0) {
        enrollmentQuery.courseId = { $in: allCourseIds };
      } else if (numericIds.length > 0) {
        enrollmentQuery.$or = [
          { courseId: { $in: numericIds } },
          { courseId: { $in: numericIds.map(id => parseInt(id)) } }
        ];
      }
      
      const enrollments = await Enrollment.find(enrollmentQuery).select('studentId').lean();
      const uniqueStudentIds = new Set(enrollments.map(e => String(e.studentId)));
      studentCount = uniqueStudentIds.size;
    }
    
    res.json({
      studentsEnrolled: studentCount,
      coursesCount: createdCourses.length + numericIds.length + mongoObjectIds.length
    });
  } catch (error) {
    console.error("GET TEACHER STATS ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// GET COURSES BY TEACHER ID (PUBLIC) - For viewing another teacher's courses
exports.getCoursesByTeacherId = async (req, res) => {
  try {
    const { teacherId } = req.params;
    console.log('getCoursesByTeacherId called with:', teacherId);
    
    // Find the teacher by various ID formats
    let teacher = null;
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    const mongoose = require("mongoose");
    
    if (objectIdPattern.test(String(teacherId))) {
      // Try finding by teacher._id first
      teacher = await Teacher.findById(teacherId).lean();
      console.log('Found by _id:', teacher ? 'yes' : 'no');
      
      // If not found, try finding by userId
      if (!teacher) {
        teacher = await Teacher.findOne({ userId: new mongoose.Types.ObjectId(teacherId) }).lean();
        console.log('Found by userId:', teacher ? 'yes' : 'no');
      }
    }

    if (!teacher) {
      console.log('Teacher not found for ID:', teacherId);
      return res.status(404).json({ message: "Teacher not found" });
    }
    
    console.log('Teacher found:', teacher._id, 'assignedCourses:', teacher.assignedCourses);

    const assignedCourseIds = teacher.assignedCourses || [];
    
    const mongoObjectIds = [];
    const numericIds = [];
    
    for (const courseId of assignedCourseIds) {
      const courseIdStr = String(courseId);
      if (objectIdPattern.test(courseIdStr)) {
        mongoObjectIds.push(courseIdStr);
      } else {
        numericIds.push(courseIdStr);
      }
    }
    
    // Get courses created by the teacher AND assigned courses
    const [createdCourses, assignedDbCourses] = await Promise.all([
      Courses.find({ teacherId: teacher._id, isApproved: true }).lean(),
      mongoObjectIds.length > 0 
        ? Courses.find({ _id: { $in: mongoObjectIds }, isApproved: true }).lean()
        : Promise.resolve([])
    ]);
    
    // Mark courses with their type
    const markedCreatedCourses = createdCourses.map(course => ({
      ...course,
      isCreatedCourse: true
    }));
    
    const markedAssignedDbCourses = assignedDbCourses.map(course => ({
      ...course,
      isAssignedCourse: true
    }));
    
    // For static/numeric course IDs, just return their IDs (frontend will match with coursesData)
    const numericPlaceholders = numericIds.map(courseIdStr => ({
      _id: courseIdStr,
      id: courseIdStr,
      isAssignedCourse: true,
      courseId: courseIdStr
    }));
    
    const allCourses = [...markedCreatedCourses, ...markedAssignedDbCourses, ...numericPlaceholders];
    
    console.log('Returning courses:', {
      created: markedCreatedCourses.length,
      assignedDb: markedAssignedDbCourses.length,
      numericPlaceholders: numericPlaceholders.length,
      total: allCourses.length
    });
    
    res.json({ courses: allCourses });
  } catch (error) {
    console.error("GET COURSES BY TEACHER ID ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// GET COURSES BY TEACHER - OPTIMIZED with parallel queries
exports.getTeacherCourses = async (req, res) => {
  try {
    const userId = req.user.userId;
    const teacher = await Teacher.findOne({ userId }).lean();
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    const assignedCourseIds = teacher.assignedCourses || [];
    
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    const mongoObjectIds = [];
    const numericIds = [];
    
    for (const courseId of assignedCourseIds) {
      const courseIdStr = String(courseId);
      if (objectIdPattern.test(courseIdStr)) {
        mongoObjectIds.push(courseIdStr);
      } else {
        numericIds.push(courseIdStr);
      }
    }
    
    // PARALLEL QUERIES for better performance
    const [createdCourses, assignedDbCourses] = await Promise.all([
      Courses.find({ teacherId: teacher._id }).lean(),
      mongoObjectIds.length > 0 
        ? Courses.find({ _id: { $in: mongoObjectIds } }).lean()
        : Promise.resolve([])
    ]);
    
    const markedCreatedCourses = createdCourses.map(course => ({
      ...course,
      isCreatedCourse: true
    }));
    
    const markedAssignedDbCourses = assignedDbCourses.map(course => ({
      ...course,
      isAssignedCourse: true
    }));
    
    const numericPlaceholders = numericIds.map(courseIdStr => ({
      _id: courseIdStr,
      id: courseIdStr,
      isAssignedCourse: true,
      courseId: courseIdStr
    }));
    
    const allCourses = [...markedCreatedCourses, ...markedAssignedDbCourses, ...numericPlaceholders];
    
    res.json({ courses: allCourses });
  } catch (error) {
    console.error("GET TEACHER COURSES ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE COURSE - OPTIMIZED
exports.updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;
    
    // Check if this user is a teacher or a general admin
    const [teacher, user, admin] = await Promise.all([
      Teacher.findOne({ userId }).select('_id').lean(),
      User.findById(userId).select('userType').lean(),
      Admin.findOne({ userId }).lean()
    ]);
    
    // Allow teachers and general admins to update courses
    const isTeacher = !!teacher;
    const isGeneralAdmin = user?.userType === 'admin' && (admin?.adminType === 'general' || !admin);
    
    if (!isTeacher && !isGeneralAdmin) {
      return res.status(403).json({ message: "Only teachers and general admins can update courses" });
    }

    // Find course - teachers can only update their own courses, admins can update any course
    const course = isTeacher 
      ? await Courses.findOne({ _id: courseId, teacherId: teacher._id })
      : await Courses.findById(courseId);
    
    if (!course) return res.status(404).json({ message: "Course not found" });

    const data = req.body;
    
    // Normalize category values to match backend enum (same as createCourse)
    const normalizeCategory = (cat) => {
      if (!cat) return cat;
      const categoryMap = {
        'Artificial Intelligence': 'Artificial Intelligence (AI)',
        'AI': 'Artificial Intelligence (AI)',
        'Data Science': 'Data Science',
        'Web Development': 'Web Development',
        'Mobile Development': 'Mobile Development',
        'Programming': 'Programming',
        'Cloud Computing': 'Cloud Computing',
        'Cyber Security': 'Cyber Security',
        'Design': 'Design',
        'Database': 'Database',
        'DevOps': 'DevOps',
        'Management': 'Management',
        'Managment': 'Management', // Handle typo in enum
        'Marketing': 'Marketing',
        'Animation & VR': 'Animation & VR'
      };
      return categoryMap[cat] || cat;
    };
    
    // Map frontend field names to backend model field names
    const mappedData = {
      courseTitle: data.title !== undefined ? data.title : (data.courseTitle !== undefined ? data.courseTitle : course.courseTitle),
      shortDescription: data.description !== undefined ? data.description : (data.shortDescription !== undefined ? data.shortDescription : course.shortDescription),
      longDescription: data.fullDescription !== undefined ? data.fullDescription : (data.longDescription !== undefined ? data.longDescription : course.longDescription),
      courseCategories: data.category !== undefined 
        ? (Array.isArray(data.category) && data.category.length > 0 
          ? data.category.map(normalizeCategory)
          : (data.category ? [normalizeCategory(data.category)] : course.courseCategories))
        : (data.courseCategories !== undefined 
          ? (Array.isArray(data.courseCategories) ? data.courseCategories.map(normalizeCategory) : [normalizeCategory(data.courseCategories)])
          : course.courseCategories),
      courseLevel: data.level !== undefined
        ? (Array.isArray(data.level) && data.level.length > 0
          ? data.level
          : (data.level ? [data.level] : course.courseLevel))
        : (data.courseLevel !== undefined ? data.courseLevel : course.courseLevel),
      totalPriceOfCourse: data.price !== undefined ? data.price : (data.totalPriceOfCourse !== undefined ? data.totalPriceOfCourse : course.totalPriceOfCourse),
      originalPriceOfCourse: data.originalPrice !== undefined ? data.originalPrice : (data.originalPriceOfCourse !== undefined ? data.originalPriceOfCourse : course.originalPriceOfCourse),
      courseImage: data.image !== undefined ? data.image : (data.courseImage !== undefined ? data.courseImage : course.courseImage),
      learningOutcomeOfCourse: data.learnings !== undefined 
        ? (Array.isArray(data.learnings) ? data.learnings.filter(l => l && l.trim() !== '') : course.learningOutcomeOfCourse)
        : (data.learningOutcomeOfCourse !== undefined ? data.learningOutcomeOfCourse : course.learningOutcomeOfCourse),
      requirements: data.requirements !== undefined 
        ? (Array.isArray(data.requirements) ? data.requirements.filter(r => r && r.trim() !== '') : course.requirements)
        : course.requirements,
      contentOfCourse: data.sections !== undefined && Array.isArray(data.sections) && data.sections.length > 0
        ? data.sections.map(section => {
            if (Array.isArray(section.items) && section.items.length > 0) {
              const topicTitles = section.items.map(item => item.title || item.topicTitle || '').filter(Boolean);
              const estimatedTimes = section.items.map(item => item.duration || item.estimatedTime || '0 min').filter(Boolean);
              return {
                sectionTitle: section.title || section.sectionTitle || '',
                topicTitle: topicTitles.join(', ') || '',
                estimatedTime: estimatedTimes.join(', ') || '0 min'
              };
            } else {
              return {
                sectionTitle: section.title || section.sectionTitle || '',
                topicTitle: section.topicTitle || section.title || '',
                estimatedTime: section.duration || section.estimatedTime || '0 min'
              };
            }
          })
        : (data.contentOfCourse !== undefined ? data.contentOfCourse : course.contentOfCourse),
      rating: data.rating !== undefined ? data.rating : course.rating,
      totalReviews: data.totalReviews !== undefined ? data.totalReviews : course.totalReviews,
      totalStudentsEnrolled: data.totalStudentsEnrolled !== undefined ? data.totalStudentsEnrolled : course.totalStudentsEnrolled,
      isApproved: data.isApproved !== undefined ? data.isApproved : course.isApproved,
    };

    Object.assign(course, mappedData);
    await course.save();

    res.json({ message: "Course updated successfully", course });
  } catch (error) {
    console.error("UPDATE COURSE ERROR:", error.message);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors || {}).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      return res.status(400).json({
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    res.status(500).json({ 
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// DELETE COURSE
exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    // Check if this user is a teacher or a general admin
    const [teacher, user, admin] = await Promise.all([
      Teacher.findOne({ userId }).select('_id').lean(),
      User.findById(userId).select('userType').lean(),
      Admin.findOne({ userId }).lean()
    ]);
    
    // Allow teachers and general admins to delete courses
    const isTeacher = !!teacher;
    const isGeneralAdmin = user?.userType === 'admin' && (admin?.adminType === 'general' || !admin);
    
    if (!isTeacher && !isGeneralAdmin) {
      return res.status(403).json({ message: "Only teachers and general admins can delete courses" });
    }

    // Find course - teachers can only delete their own courses, admins can delete any course
    const course = isTeacher 
      ? await Courses.findOneAndDelete({ _id: courseId, teacherId: teacher._id })
      : await Courses.findByIdAndDelete(courseId);
    
    if (!course) return res.status(404).json({ message: "Course not found" });
    
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("DELETE COURSE ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ADD COURSE REQUIREMENTS
exports.addReqOfCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    const teacher = await Teacher.findOne({ userId }).select('_id').lean();
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    
    const course = await Courses.findOne({ _id: courseId, teacherId: teacher._id });
    if (!course) {
      return res.status(404).json({ message: "Course not found or you are not the owner" });
    }

    const { requirements } = req.body;
    if (!requirements || !Array.isArray(requirements)) {
      return res.status(400).json({ message: "Requirements must be an array" });
    }
    
    course.requirements.push(...requirements);
    await course.save();

    return res.status(200).json({
      message: "Requirements added successfully",
      course
    });

  } catch (error) {
    console.error("ADD COURSE REQUIREMENTS ERROR:", error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ADD LEARNING OUTCOME
exports.learnOutcome = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { userId } = req.user;

    const teacher = await Teacher.findOne({ userId }).select('_id').lean();
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const course = await Courses.findOne({ _id: courseId, teacherId: teacher._id });
    if (!course) {
      return res.status(404).json({ message: "Course not found or you are not the owner" });
    }

    const lrnOutCom = req.body.learningOutcomeOfCourse;
    if (!lrnOutCom || !Array.isArray(lrnOutCom)) {
      return res.status(400).json({ message: "Learning Outcome must be an array" });
    }

    course.learningOutcomeOfCourse.push(...lrnOutCom);
    await course.save();
    
    return res.status(200).json({ message: "Learning Outcome saved successfully", course });

  } catch (error) {
    console.error("ADD LEARNING OUTCOME ERROR:", error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ADD CONTENT OF COURSE
exports.addContentOfCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    const teacher = await Teacher.findOne({ userId }).select('_id').lean();
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const course = await Courses.findOne({ _id: courseId, teacherId: teacher._id });
    if (!course) {
      return res.status(404).json({ message: "Course not found or you are not the owner" });
    }

    const { contentOfCourse } = req.body; 
    if (!contentOfCourse || !Array.isArray(contentOfCourse)) {
      return res.status(400).json({ message: "Content must be an array" });
    }

    course.contentOfCourse.push(...contentOfCourse);
    await course.save();

    return res.status(200).json({
      message: "Content added successfully",
      course
    });

  } catch (error) {
    console.error("ADD COURSE CONTENT ERROR:", error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ASSIGN TEACHER TO EXISTING COURSE
exports.assignTeacherToCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    const teacher = await Teacher.findOne({ userId });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found. Please complete your teacher profile first." });
    }

    const courseIdStr = String(courseId);
    if (teacher.assignedCourses && teacher.assignedCourses.some(id => String(id) === courseIdStr)) {
      return res.status(400).json({ message: "You are already assigned to this course" });
    }

    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    const isObjectId = objectIdPattern.test(courseIdStr);
    
    let courseTitle = courseId;
    
    if (isObjectId) {
      const course = await Courses.findById(courseId).select('courseTitle teacherId').lean();
      if (course) {
        if (String(course.teacherId) === String(teacher._id)) {
          return res.status(400).json({ message: "You are already the owner of this course" });
        }
        // Course already has another instructor (creator or admin-assigned)
        if (course.teacherId) {
          return res.status(400).json({
            message: "This course is already taught by another instructor. Try creating your own course via Create New Course."
          });
        }
        courseTitle = course.courseTitle || course.title || courseId;
      }
      // DB course with no teacherId: check if any other teacher has it in assignedCourses
      const otherWithAssignment = await Teacher.findOne({
        _id: { $ne: teacher._id },
        assignedCourses: { $in: [courseIdStr, courseId] }
      }).select('fullName').lean();
      if (otherWithAssignment) {
        return res.status(400).json({
          message: "This course is already taught by another instructor. Try creating your own course via Create New Course."
        });
      }
    } else {
      // Default course (numeric id): reject if any other teacher is already assigned
      const otherWithAssignment = await Teacher.findOne({
        _id: { $ne: teacher._id },
        assignedCourses: { $in: [courseIdStr, parseInt(courseIdStr, 10)] }
      }).select('fullName').lean();
      if (otherWithAssignment) {
        return res.status(400).json({
          message: "This course is already taught by another instructor. Try creating your own course via Create New Course."
        });
      }
    }

    if (!teacher.assignedCourses) {
      teacher.assignedCourses = [];
    }
    
    const courseIdToStore = String(courseId);
    
    if (teacher.assignedCourses.some(id => String(id) === courseIdToStore)) {
      return res.status(400).json({ message: "You are already assigned to this course" });
    }
    
    teacher.assignedCourses.push(courseIdToStore);
    teacher.markModified('assignedCourses');
    await teacher.save();

    res.json({ 
      message: "Successfully assigned as instructor to course",
      course: {
        _id: courseId,
        courseTitle: courseTitle
      }
    });
  } catch (error) {
    console.error("ASSIGN TEACHER TO COURSE ERROR:", error.message);
    res.status(500).json({ 
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// REMOVE TEACHER FROM COURSE ASSIGNMENT
exports.removeTeacherFromCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    const teacher = await Teacher.findOne({ userId });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found. Please complete your teacher profile first." });
    }

    if (teacher.assignedCourses) {
      teacher.assignedCourses = teacher.assignedCourses.filter(
        id => String(id) !== String(courseId)
      );
      await teacher.save();
    }

    res.json({ message: "Successfully removed from course assignment" });
  } catch (error) {
    console.error("REMOVE TEACHER FROM COURSE ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// GET WHICH COURSES ARE ALREADY TAUGHT BY ANOTHER TEACHER (for Select Existing Courses page)
exports.getCoursesAssignmentStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Support both POST body and GET query (courseIds=1,2,3 or courseIds=1&courseIds=2)
    let courseIds = req.body?.courseIds;
    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      const q = req.query?.courseIds;
      courseIds = typeof q === 'string' ? q.split(',').map(s => s.trim()).filter(Boolean) : (Array.isArray(q) ? q : []);
    }

    const teacher = await Teacher.findOne({ userId }).lean();
    if (!teacher) {
      return res.status(403).json({ message: "Teacher profile required" });
    }

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return res.json({ assignmentStatus: {} });
    }

    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    const result = {};

    // Build all ID variants for a single query (string + number for numeric IDs)
    const allVariants = [];
    for (const cid of courseIds) {
      const s = String(cid);
      allVariants.push(s);
      const n = parseInt(s, 10);
      if (!isNaN(n)) allVariants.push(n);
      if (objectIdPattern.test(s)) allVariants.push(cid);
    }

    // Single query: all other teachers who have ANY of these course IDs in assignedCourses
    const otherTeachers = await Teacher.find({
      _id: { $ne: teacher._id },
      assignedCourses: { $in: allVariants }
    }).select('fullName assignedCourses').lean();

    // For each courseId, find which (if any) other teacher has it
    for (const cid of courseIds) {
      const courseIdStr = String(cid);
      const isObjectId = objectIdPattern.test(courseIdStr);

      if (isObjectId) {
        const course = await Courses.findById(courseIdStr).select('teacherId').lean();
        if (course && course.teacherId && String(course.teacherId) !== String(teacher._id)) {
          const otherTeacher = otherTeachers.find(t => String(t._id) === String(course.teacherId)) ||
            await Teacher.findById(course.teacherId).select('fullName').lean();
          result[courseIdStr] = { taughtBy: otherTeacher?.fullName || "Another instructor" };
          continue;
        }
      }

      const numericId = parseInt(courseIdStr, 10);
      const hasNumeric = !isNaN(numericId);
      const otherWithAssignment = otherTeachers.find(t => {
        const assigned = t.assignedCourses || [];
        return assigned.some(a => String(a) === courseIdStr || (hasNumeric && Number(a) === numericId));
      });
      if (otherWithAssignment) {
        result[courseIdStr] = { taughtBy: otherWithAssignment.fullName || "Another instructor" };
      } else {
        result[courseIdStr] = null;
      }
    }

    res.json({ assignmentStatus: result });
  } catch (error) {
    console.error("GET COURSES ASSIGNMENT STATUS ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
