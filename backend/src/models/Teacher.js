const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
  {
    // Link to User through his ObjectID/ Primary Key value
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    // PERSONAL INFO
    fullName: {
      type: String,
      required: true
    },

    profTitle: {
      type: String,
      required: true
    },

    phoneNumber: {
      type: String,
      required: true
    },

    location: {
      type: String,
      required: true
    },

    aboutMe: {
      type: String,
      required: true
    },

    /* 
    / SKILLS (VERY IMPORTANT)
    
    skills: {
      type: [String],
      default: []
    },
    */

    // EDUCATION
    education: [
      {
        instName: { type: String, required: true },
        degreeName: { type: String, required: true },
        fieldOfStudy: { type: String },
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        isCurrentlyEnrolled: {
          type: Boolean,
          default: false
        }
      }
    ],

    // EXPERIENCE
    experience: [
      {
        companyName: { type: String, required: true },
        position: { type: String, required: true },
        description : {type: String},
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        isCurrentlyWorking: { type: Boolean, default: false}
      }
    ],

    // CERTIFICATES & COURSES
    certificatesCourses: [
      {
        certificateName: { type: String, required: true },
        organization: { type: String, required: true },
        credentialID: { type: String},
        issueDate: { type: Date},
        expiryDate: { type: Date }
      }
    ],

    // ACCOUNT STATUS
    isAccountVerified: {
      type: Boolean,
      default: true // account status to be chaged later to true after complete functionality.
    },

    isAccountBlocked: {
      type: Boolean,
      default: false
    },

    // Courses assigned to this teacher (courses they didn't create but are instructors for)
    // Supports both MongoDB ObjectIds (for teacher-created courses) and numeric IDs (for default courses)
    assignedCourses: [{
      type: mongoose.Schema.Types.Mixed
    }]

    // Payment model will be added later
  },
  { timestamps: true }
);

// Add index for faster queries (userId already has unique: true which creates an index)
// No additional indexes needed since userId is the main query field

module.exports = mongoose.model("Teacher", teacherSchema);
