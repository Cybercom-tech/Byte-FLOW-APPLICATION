const Newsletter = require('../models/Newsletter');
const { sendNewsletterEmail } = require('../services/emailService');

/**
 * Subscribe to newsletter
 */
const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if already subscribed
    const existing = await Newsletter.findOne({ email: email.toLowerCase() });
    if (existing) {
      if (existing.active) {
        return res.status(200).json({ message: 'Email already subscribed' });
      } else {
        // Reactivate subscription
        existing.active = true;
        existing.subscribedAt = new Date();
        await existing.save();
      }
    } else {
      // Create new subscription
      const newsletter = new Newsletter({
        email: email.toLowerCase(),
      });
      await newsletter.save();
    }

    // Send email notification
    try {
      await sendNewsletterEmail(email);
    } catch (emailError) {
      console.error('Error sending newsletter email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(200).json({
      message: 'Successfully subscribed to newsletter',
      email: email.toLowerCase(),
    });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    res.status(500).json({ message: 'Error subscribing to newsletter', error: error.message });
  }
};

/**
 * Unsubscribe from newsletter
 */
const unsubscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const newsletter = await Newsletter.findOne({ email: email.toLowerCase() });
    if (!newsletter) {
      return res.status(404).json({ message: 'Email not found in newsletter list' });
    }

    newsletter.active = false;
    await newsletter.save();

    res.status(200).json({ message: 'Successfully unsubscribed from newsletter' });
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    res.status(500).json({ message: 'Error unsubscribing from newsletter', error: error.message });
  }
};

/**
 * Get all newsletter subscriptions (admin only - optional)
 */
const getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Newsletter.find({ active: true }).sort({ subscribedAt: -1 });
    res.status(200).json({ subscriptions });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Error fetching subscriptions', error: error.message });
  }
};

module.exports = {
  subscribeNewsletter,
  unsubscribeNewsletter,
  getSubscriptions,
};

