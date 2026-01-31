const Message = require("../models/Message");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const ZoomLink = require("../models/ZoomLink");
const Notification = require("../models/Notification");
const User = require("../models/User");
const Courses = require("../models/Courses");
const mongoose = require("mongoose");

// TEACHER → SEND MESSAGE TO STUDENTS - OPTIMIZED with batch operations
exports.sendMessageToStudents = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId, studentIds, message, messageType, date, time } = req.body;

    const teacher = await Teacher.findOne({ userId }).lean();
    if (!teacher) {
      return res.status(403).json({ message: "Only teachers allowed" });
    }

    // BATCH QUERY: Get all students at once instead of N individual queries
    const students = await Student.find({ _id: { $in: studentIds } }).lean();
    const studentMap = new Map(students.map(s => [s._id.toString(), s]));

    // Build all message documents at once
    const messageDocuments = [];
    const notificationDocuments = [];
    
    const meetingDate = date ? new Date(date) : null;
    const validMeetingDate = meetingDate && !isNaN(meetingDate.getTime()) ? meetingDate : null;

    for (const studentId of studentIds) {
      const student = studentMap.get(studentId.toString());
      if (!student) continue;

      messageDocuments.push({
        teacherId: teacher._id,
        studentId: student._id,
        courseId,
        message,
        messageType: messageType || "info",
        direction: "teacher_to_student",
        meetingDate: validMeetingDate,
        meetingTime: time || null
      });
    }

    // BATCH INSERT: Insert all messages at once
    const savedMessages = await Message.insertMany(messageDocuments);

    // Create notifications only for announcements/reminders (not regular chat)
    if (messageType && messageType !== "info" && messageType !== "student_message") {
      // Get student user IDs for notifications
      const studentUserIds = students.map(s => s.userId);
      
      let notificationType = "General";
      if (messageType === "announcement") notificationType = "Announcement";
      else if (messageType === "reminder") notificationType = "Reminder";

      for (const student of students) {
        notificationDocuments.push({
          receiverId: student.userId,
          senderId: teacher._id,
          type: notificationType,
          message: message.length > 100 ? message.substring(0, 100) + "..." : message
        });
      }

      // BATCH INSERT: Insert all notifications at once
      if (notificationDocuments.length > 0) {
        await Notification.insertMany(notificationDocuments).catch(err => {
          console.error("Error creating notifications:", err.message);
        });
      }
    }

    res.status(201).json({
      message: "Messages sent successfully",
      count: savedMessages.length,
      messages: savedMessages
    });
  } catch (error) {
    console.error("SEND MESSAGE ERROR:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// TEACHER → SEND ZOOM LINK TO STUDENTS - OPTIMIZED
exports.sendZoomLink = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId, studentIds, zoomLink, meetingId, password, date, time } = req.body;

    if (!courseId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "courseId and studentIds array are required" });
    }

    if (!zoomLink || !zoomLink.trim()) {
      return res.status(400).json({ message: "zoomLink is required" });
    }

    if (!date || !date.trim()) {
      return res.status(400).json({ message: "Meeting date is required" });
    }

    if (!time || !time.trim()) {
      return res.status(400).json({ message: "Meeting time is required" });
    }

    const teacher = await Teacher.findOne({ userId }).lean();
    if (!teacher) {
      return res.status(403).json({ message: "Only teachers allowed" });
    }

    const courseIdStr = String(courseId);
    const numericCourseId = isNaN(parseInt(courseIdStr)) ? null : parseInt(courseIdStr);

    // Save or update Zoom link for course
    let zoomLinkDoc = null;
    
    if (numericCourseId !== null) {
      zoomLinkDoc = await ZoomLink.findOne({ 
        $or: [{ courseId: courseIdStr }, { courseId: numericCourseId }]
      });
    } else {
      zoomLinkDoc = await ZoomLink.findOne({ courseId: courseIdStr });
    }
    
    if (zoomLinkDoc) {
      zoomLinkDoc.zoomLink = zoomLink;
      zoomLinkDoc.meetingId = meetingId || "";
      zoomLinkDoc.password = password || "";
      zoomLinkDoc.date = date || "";
      zoomLinkDoc.time = time || "";
      await zoomLinkDoc.save();
    } else {
      zoomLinkDoc = new ZoomLink({
        courseId: courseIdStr,
        zoomLink,
        meetingId: meetingId || "",
        password: password || "",
        date: date || "",
        time: time || ""
      });
      await zoomLinkDoc.save();
    }

    // Build message text
    let messageText = `Zoom Meeting Link:\n${zoomLink}`;
    if (meetingId) messageText += `\nMeeting ID: ${meetingId}`;
    if (password) messageText += `\nPassword: ${password}`;
    if (date) messageText += `\n\nDate: ${date}`;
    if (time) messageText += `\nTime: ${time}`;

    // BATCH QUERY: Get all valid students at once
    const validStudentIds = studentIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    const students = await Student.find({ _id: { $in: validStudentIds } }).lean();
    
    if (students.length === 0) {
      return res.status(400).json({ message: "No valid students found to send Zoom link to" });
    }

    // Parse date once
    let meetingDateObj = null;
    if (date) {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        meetingDateObj = parsedDate;
      }
    }

    // Build all message documents at once
    const messageDocuments = students.map(student => ({
      teacherId: teacher._id,
      studentId: student._id,
      courseId: courseIdStr,
      message: messageText,
      messageType: "zoom_link",
      direction: "teacher_to_student",
      zoomLink,
      meetingId: meetingId || null,
      password: password || null,
      meetingDate: meetingDateObj,
      meetingTime: time || null
    }));

    // BATCH INSERT: Insert all messages at once
    const savedMessages = await Message.insertMany(messageDocuments);

    // Build notification message
    let courseTitle = "Course";
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    if (objectIdPattern.test(courseIdStr)) {
      const course = await Courses.findById(courseIdStr).select("courseTitle").lean();
      if (course) courseTitle = course.courseTitle;
    }

    let notificationMessage = `New Zoom meeting link for ${courseTitle}`;
    if (date && time) {
      notificationMessage += `. Scheduled for ${date} at ${time}`;
    } else if (date) {
      notificationMessage += `. Scheduled for ${date}`;
    } else if (time) {
      notificationMessage += `. Scheduled for ${time}`;
    }

    // BATCH INSERT: Create all notifications at once
    const notificationDocuments = students.map(student => ({
      receiverId: student.userId,
      senderId: teacher._id,
      type: "Announcement",
      message: notificationMessage
    }));

    await Notification.insertMany(notificationDocuments).catch(err => {
      console.error("Error creating notifications:", err.message);
    });

    res.status(201).json({
      message: "Zoom link sent successfully",
      count: savedMessages.length,
      zoomLink: zoomLinkDoc
    });
  } catch (error) {
    console.error("SEND ZOOM LINK ERROR:", error.message);
    res.status(500).json({ 
      message: "Server Error", 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// STUDENT → GET MY MESSAGES - OPTIMIZED with batch course lookup
exports.getStudentMessages = async (req, res) => {
  try {
    const userId = req.user.userId;
    const student = await Student.findOne({ userId }).lean();
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const messages = await Message.find({ studentId: student._id })
      .populate("teacherId", "fullName profTitle")
      .sort({ createdAt: -1 })
      .lean();

    // Extract unique ObjectId courseIds for batch lookup
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    const objectIdCourseIds = [...new Set(
      messages
        .map(m => String(m.courseId))
        .filter(id => objectIdPattern.test(id))
    )];

    // BATCH QUERY: Get all courses at once
    const courses = objectIdCourseIds.length > 0 
      ? await Courses.find({ _id: { $in: objectIdCourseIds } }).select("courseTitle").lean()
      : [];
    const courseMap = new Map(courses.map(c => [c._id.toString(), c]));

    // Enrich messages with course info
    const enrichedMessages = messages.map(msg => {
      const courseIdStr = String(msg.courseId);
      if (objectIdPattern.test(courseIdStr)) {
        const course = courseMap.get(courseIdStr);
        if (course) {
          msg.courseId = { _id: course._id, courseTitle: course.courseTitle };
        }
      }
      return msg;
    });

    res.json({ messages: enrichedMessages });
  } catch (error) {
    console.error("GET STUDENT MESSAGES ERROR:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// STUDENT → SEND MESSAGE TO TEACHER
exports.sendMessageToTeacher = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId, teacherId, message, replyTo } = req.body;

    const student = await Student.findOne({ userId }).lean();
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const teacher = await Teacher.findById(teacherId).select('_id').lean();
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const newMessage = new Message({
      teacherId: teacher._id,
      studentId: student._id,
      courseId,
      message,
      messageType: "student_message",
      direction: "student_to_teacher",
      replyTo: replyTo || null
    });

    await newMessage.save();

    res.status(201).json({
      message: "Message sent successfully",
      messageData: newMessage
    });
  } catch (error) {
    console.error("SEND MESSAGE TO TEACHER ERROR:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// TEACHER → GET MESSAGES FROM STUDENTS - OPTIMIZED with batch lookups
exports.getTeacherMessages = async (req, res) => {
  try {
    const userId = req.user.userId;
    const teacher = await Teacher.findOne({ userId }).lean();
    
    if (!teacher) {
      return res.status(403).json({ message: "Only teachers allowed" });
    }

    const messages = await Message.find({ teacherId: teacher._id })
      .populate("studentId", "userId")
      .sort({ createdAt: -1 })
      .lean();

    // Extract unique user IDs and course IDs for batch lookup
    const userIds = [...new Set(
      messages
        .filter(m => m.studentId && m.studentId.userId)
        .map(m => m.studentId.userId.toString())
    )];

    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    const objectIdCourseIds = [...new Set(
      messages
        .map(m => String(m.courseId))
        .filter(id => objectIdPattern.test(id))
    )];

    // BATCH QUERIES: Get all users and courses at once
    const [users, courses] = await Promise.all([
      User.find({ _id: { $in: userIds } }).select("name email").lean(),
      objectIdCourseIds.length > 0 
        ? Courses.find({ _id: { $in: objectIdCourseIds } }).select("courseTitle").lean()
        : Promise.resolve([])
    ]);

    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    const courseMap = new Map(courses.map(c => [c._id.toString(), c]));

    // Enrich messages with user and course info
    const enrichedMessages = messages.map(msg => {
      // Add student name
      if (msg.studentId && msg.studentId.userId) {
        const user = userMap.get(msg.studentId.userId.toString());
        if (user) {
          msg.studentId.name = user.name || '';
          msg.studentId.email = user.email || '';
        }
      }
      
      // Add course title
      const courseIdStr = String(msg.courseId);
      if (objectIdPattern.test(courseIdStr)) {
        const course = courseMap.get(courseIdStr);
        if (course) {
          msg.courseId = { _id: course._id, courseTitle: course.courseTitle };
        }
      }
      
      return msg;
    });

    res.json({ messages: enrichedMessages });
  } catch (error) {
    console.error("GET TEACHER MESSAGES ERROR:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// MARK MESSAGE AS READ - OPTIMIZED
exports.markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    // Use findById with lean for faster read
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check authorization with parallel queries
    const [student, teacher] = await Promise.all([
      Student.findOne({ userId }).select('_id').lean(),
      Teacher.findOne({ userId }).select('_id').lean()
    ]);

    if (student && message.studentId.toString() === student._id.toString()) {
      message.read = true;
      await message.save();
      return res.json({ message: "Message marked as read" });
    }

    if (teacher && message.teacherId.toString() === teacher._id.toString()) {
      message.read = true;
      await message.save();
      return res.json({ message: "Message marked as read" });
    }

    return res.status(403).json({ message: "Access denied" });
  } catch (error) {
    console.error("MARK MESSAGE AS READ ERROR:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// GET ZOOM LINK FOR COURSE
exports.getZoomLink = async (req, res) => {
  try {
    const { courseId } = req.params;
    const courseIdStr = String(courseId);
    const numericCourseId = isNaN(parseInt(courseIdStr)) ? null : parseInt(courseIdStr);
    
    let zoomLink = null;
    
    if (numericCourseId !== null) {
      zoomLink = await ZoomLink.findOne({ 
        $or: [{ courseId: courseIdStr }, { courseId: numericCourseId }]
      }).lean();
    } else {
      zoomLink = await ZoomLink.findOne({ courseId: courseIdStr }).lean();
    }
    
    if (!zoomLink) {
      return res.status(404).json({ message: "Zoom link not found" });
    }

    res.json({ zoomLink });
  } catch (error) {
    console.error("GET ZOOM LINK ERROR:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};
