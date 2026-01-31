const express = require("express");
const router =  express.Router();
const Teacher =  require("../models/Teacher");
const {createTeacherProfile,  getMyTeacherProfile, getTeacherProfileById,
     addEducation, getEducations, updateEducation, deleteEducation,
     addExperience, getExperiences, updateExperience, deleteExperience,
     addCertificate, getCertificates, updateCertificate, deleteCertificate,
     getTeacherStudents, getCourseStudents,
     updateStudentProgress, getStudentProgress
     } = require ("../controllers/teacherController");

const { getAllCourses, getTeacherCourses } = require("../controllers/courseController");

const authMiddleware = require ("../middlewares/authMiddleware");

router.post("/create-profile", authMiddleware, createTeacherProfile);  // create teacher profile  
router.post("/me", authMiddleware, getMyTeacherProfile);  // display teacher profile
router.get("/profile/:teacherId", getTeacherProfileById);  // public endpoint to view teacher profile by ID

router.post("/education", authMiddleware, addEducation); //  ADD Education 
router.get("/education", authMiddleware, getEducations);    //  GET education details that have been added  
router.put("/education/:educationId", authMiddleware, updateEducation); // UPDATE/ EDIT edduaction field here
router.delete("/education/:educationId", authMiddleware, deleteEducation); // DELETE any education feild

router.post("/experience", authMiddleware, addExperience); // ADD experience here
router.get("/experience", authMiddleware, getExperiences);  // GET/fetch experience from database
router.put("/experience/:experienceId", authMiddleware, updateExperience); // UPDATE experience field
router.delete("/experience/:experienceId", authMiddleware, deleteExperience);   // delete expereience field here

router.post("/certificate", authMiddleware, addCertificate);     // ADD certificate field 
router.get("/certificate", authMiddleware, getCertificates);     // GET/fetch certificates from database
router.put("/certificate/:certificateId", authMiddleware, updateCertificate);   // UPDATE certificate field
router.delete("/certificate/:certificateId", authMiddleware, deleteCertificate);     // delete certificate field here

// GETING ALL COURSES
router.get("/courses", authMiddleware, getAllCourses); // API to get all courses available on the platform, 
router.get("/my-courses", authMiddleware, getTeacherCourses);     // GET/fetch teacher's created own courses

// GET STUDENTS
router.get("/students", authMiddleware, getTeacherStudents); // Get all students across all teacher's courses
router.get("/courses/:courseId/students", authMiddleware, getCourseStudents); // Get students for a specific course

// MANAGE STUDENT PROGRESS
router.get("/courses/:courseId/students/:studentId/progress", authMiddleware, getStudentProgress); // Get student progress
router.put("/courses/:courseId/students/:studentId/progress", authMiddleware, updateStudentProgress); // Update student progress

module.exports = router;

