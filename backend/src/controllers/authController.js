const User = require("../models/User");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// helper function (DRY) TO GENERATE TOKEN
const generateToken = (user) => {  //gets data from user during signup below,  
  return jwt.sign(
    {
      userId: user._id,  //data
      role: user.userType
    },
    process.env.JWT_SECRET, // secret
    { expiresIn: "1d" } // options 
  );
};

// =======================
// SIGNUP + AUTO LOGIN
// =======================
exports.signup = async (req, res) => {
  try {
    const { name, email, password, userType } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      userType: userType || "student"
    });

    await newUser.save();

    // 🔐 AUTO LOGIN
    // call generateToken fun, with newUser data,
    const token = generateToken(newUser);

    const safeUser = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      userType: newUser.userType
    };

    res.status(201).json({
      message: "Signup successful",
      token,
      user: safeUser
    });

  } catch (error) {
    console.error("SIGNUP ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// LOGIN
// =======================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check if user is banned
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

    const token = generateToken(user);

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      userType: user.userType
          };

    res.json({
      message: "Login successful",
      token,
      user: safeUser
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
