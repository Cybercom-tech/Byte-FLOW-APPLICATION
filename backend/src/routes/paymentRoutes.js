const express = require("express");
const router = express.Router();
const {
  verifyPaymentByTransaction,
  getPaymentStatus,
  handlePaymentWebhook,
  sendEnrollmentEmail
} = require("../controllers/paymentController");

// Payment verification (can be called by frontend)
router.post("/verify", verifyPaymentByTransaction);

// Get payment status (for polling)
router.get("/status", getPaymentStatus);

// Webhook endpoint (for payment gateways)
router.post("/webhook", handlePaymentWebhook);

// Send enrollment email notification
router.post("/enrollment-email", sendEnrollmentEmail);

module.exports = router;

