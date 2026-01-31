const mongoose = require("mongoose");

// Cousrses Model
const coursesSchema = new mongoose.Schema(
{
    courseTitle : { type: String, required: true},
    shortDescription : { type: String, required: true, maxlengtt: 150},
    longDescription : { type: String, required: true, maxlength: 5000},
    
    courseCategories: [{
    type: String,
    enum: ["Animation & VR", "Artificial Intelligence (AI)", "Cloud Computing", "Cyber Security", "Data Science" , "Database" , 
        "Design", "DevOps", "Managment", "Marketing", "Management", "Mobile Development",
         "Programming", "Web Development"], // allowed values
            }],

    courseLevel: [{
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced"]}],

    totalPriceOfCourse:{
        type:Number
            },

    originalPriceOfCourse:{
        type:Number,
        required: true
            },

    courseImage : {
        type: String, // URL to be inserted as actual image to be stored on cloud
        required: true
    },
    learningOutcomeOfCourse:{
        type: [String],
        default : [],
        required: true
    },
    requirements:{
        type: [String],
        default : [],
        required: true
    },
    
    //Content of the course 
    contentOfCourse:[{   //only text for now
      sectionTitle:{ type: String, required: true},
      topicTitle:{ type: String, required: true},
      estimatedTime:{ type: String, required: true}
    }],
     
   rating: {
  type: Number,
  default: 0
},

totalReviews: {
  type: Number,
  default: 0
},

totalStudentsEnrolled: {
  type: Number,
  default: 0
},

    teacherId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Teacher",
  required: false // Allow admin-created courses without teacherId
},

// courseId field for default courses (numeric IDs from coursesData.js)
// This allows the backend to find default courses that aren't MongoDB ObjectIds
// - For teacher-created courses: courseId is typically not set (uses _id instead)
// - For default/pre-made courses: courseId is set to the numeric ID (1, 2, 3, etc.)
// - This field enables enrollment for default courses even if they're not seeded in the database
// - Default courses are pre-approved and don't require database existence for enrollment
courseId: {
  type: mongoose.Schema.Types.Mixed, // Can be String or Number
  required: false, // Optional - only for default courses
  sparse: true // Allows multiple null values (for teacher-created courses)
  // Note: Index is added explicitly below for better control
},

isApproved: {
  type: Boolean,
  default: true     // Approved for Now will be turned Off for later 
},
rejectedAt: {
  type: Date,
  default: null
},
rejectedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null
},
rejectionReason: {
  type: String,
  default: null
},
approvedAt: {
  type: Date,
  default: null
},
approvedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null
}

})

// Add indexes for faster queries
coursesSchema.index({ teacherId: 1 }) // Speed up queries by teacher
coursesSchema.index({ isApproved: 1 }) // Speed up filtering by approval status
coursesSchema.index({ teacherId: 1, isApproved: 1 }) // Compound index for common query
coursesSchema.index({ courseId: 1 }) // Speed up queries by courseId (for default courses)
coursesSchema.index({ courseId: 1, isApproved: 1 }) // Compound index for courseId + isApproved

module.exports = mongoose.model ("Courses", coursesSchema)