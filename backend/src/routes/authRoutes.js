const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");

const {
  signup,
  login
} = require("../controllers/authController");

// Public routes
router.post("/signup", signup);
router.post("/login", login);

// Example protected admin route
router.get("/admin", authMiddleware, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  res.json({
    message: "Welcome Admin",
    adminId: req.user.userId
  });
});

module.exports = router;
