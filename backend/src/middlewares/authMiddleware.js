const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");

const authMiddleware = async (req, res, next) => {
  try {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded will contain the payload we signed (userId, role, iat, exp)
    req.user = decoded; // e.g. { userId: "...", role: "student", iat: ..., exp: ... }

    // Check if user is banned
    const user = await User.findById(decoded.userId).select('userType').lean();
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    let isBanned = false;
    if (user.userType === "teacher") {
      const teacher = await Teacher.findOne({ userId: user._id }).select('isAccountBlocked').lean();
      if (teacher && teacher.isAccountBlocked) {
        isBanned = true;
      }
    } else if (user.userType === "student") {
      const student = await Student.findOne({ userId: user._id }).select('isAccountBlocked').lean();
      if (student && student.isAccountBlocked) {
        isBanned = true;
      }
    }

    if (isBanned) {
      return res.status(403).json({ 
        message: "Your account has been banned. Please contact support for assistance.",
        banned: true
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;
