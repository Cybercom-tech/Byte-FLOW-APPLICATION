const express = require('express');
const router = express.Router();
const { subscribeNewsletter, unsubscribeNewsletter, getSubscriptions } = require('../controllers/newsletterController');
const authMiddleware = require('../middlewares/authMiddleware');
const User = require('../models/User');

/**
 * Check if user is admin
 */
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (user && user.userType === 'admin') {
      return next();
    }
    return res.status(403).json({ message: 'Admin access required' });
  } catch (error) {
    return res.status(500).json({ message: 'Error checking admin status' });
  }
};

// Public routes
router.post('/subscribe', subscribeNewsletter);
router.post('/unsubscribe', unsubscribeNewsletter);

// Admin routes (protected)
router.get('/all', authMiddleware, isAdmin, getSubscriptions);

module.exports = router;

