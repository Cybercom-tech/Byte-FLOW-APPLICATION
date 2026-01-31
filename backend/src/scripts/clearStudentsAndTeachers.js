/**
 * Clears all students, teachers, and their related data from the database.
 * Does NOT drop tables/collections or change schema - only deletes documents.
 *
 * Run from backend: node src/scripts/clearStudentsAndTeachers.js
 * Or: npm run clear-students-teachers
 */

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const Enrollment = require("../models/Enrollment");
const Review = require("../models/Review");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const ZoomLink = require("../models/ZoomLink");
const Courses = require("../models/Courses");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const User = require("../models/User");

async function clearStudentsAndTeachers() {
  try {
    connectDB();

    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) resolve();
      else mongoose.connection.once("connected", resolve);
    });

    console.log("🗑️  Clearing all students, teachers, and related data...\n");

    // 1. Related data that references students/teachers (child data first)
    const enrollResult = await Enrollment.deleteMany({});
    console.log(`   ✅ Enrollments: ${enrollResult.deletedCount} deleted`);

    const reviewResult = await Review.deleteMany({});
    console.log(`   ✅ Reviews: ${reviewResult.deletedCount} deleted`);

    const messageResult = await Message.deleteMany({});
    console.log(`   ✅ Messages: ${messageResult.deletedCount} deleted`);

    // Notifications: sent by teachers or received by student/teacher users (get IDs before deleting)
    const teachers = await Teacher.find({}).select("_id userId").lean();
    const teacherIds = teachers.map((t) => t._id);
    const teacherUserIds = teachers.map((t) => t.userId);
    const students = await Student.find({}).select("userId").lean();
    const studentUserIds = students.map((s) => s.userId);
    const receiverIds = [...new Set([...studentUserIds, ...teacherUserIds])];

    const notifResult = await Notification.deleteMany({
      $or: [{ senderId: { $in: teacherIds } }, { receiverId: { $in: receiverIds } }],
    });
    console.log(`   ✅ Notifications: ${notifResult.deletedCount} deleted`);

    // Teacher-created courses and their ZoomLinks
    const teacherCourses = await Courses.find({ teacherId: { $ne: null } }).select("_id").lean();
    const teacherCourseIds = teacherCourses.map((c) => c._id);

    const zoomResult = await ZoomLink.deleteMany({ courseId: { $in: teacherCourseIds } });
    console.log(`   ✅ ZoomLinks (teacher courses): ${zoomResult.deletedCount} deleted`);

    const coursesResult = await Courses.deleteMany({ teacherId: { $ne: null } });
    console.log(`   ✅ Courses (teacher-created): ${coursesResult.deletedCount} deleted`);

    // 2. Student and Teacher documents
    const studentResult = await Student.deleteMany({});
    console.log(`   ✅ Students: ${studentResult.deletedCount} deleted`);

    const teacherResult = await Teacher.deleteMany({});
    console.log(`   ✅ Teachers: ${teacherResult.deletedCount} deleted`);

    // 3. User accounts for students and teachers
    const userResult = await User.deleteMany({ userType: { $in: ["student", "teacher"] } });
    console.log(`   ✅ Users (student/teacher): ${userResult.deletedCount} deleted`);

    console.log("\n✅ Done. All student/teacher data and related records have been removed.");
    console.log("   Tables/collections and relationships are unchanged.\n");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

clearStudentsAndTeachers();
