// Payment Verification Utility
// Handles automatic verification of bank transfers through various methods

/**
 * Payment Gateway Integration Options:
 * 1. Stripe - International payments
 * 2. PayPal - International payments
 * 3. JazzCash - Pakistan
 * 4. EasyPaisa - Pakistan
 * 5. Bank APIs - Direct bank integration
 * 6. Webhook-based verification
 */

// Simulated payment gateway webhook handler
// In production, this would be a server-side endpoint
export const handlePaymentWebhook = async (webhookData) => {
  try {
    const { transactionId, amount, status, paymentMethod, metadata } = webhookData
    
    // Verify transaction
    if (status === 'completed' || status === 'success') {
      return {
        success: true,
        verified: true,
        transactionId,
        amount,
        verifiedAt: new Date().toISOString()
      }
    }
    
    return {
      success: false,
      verified: false,
      reason: 'Payment not completed'
    }
  } catch (error) {
    console.error('Webhook verification error:', error)
    return {
      success: false,
      verified: false,
      error: error.message
    }
  }
}

/**
 * Verify payment using transaction ID and amount matching
 * This is a basic verification method that can be used with any payment gateway
 */
export const verifyPaymentByTransaction = async (transactionId, expectedAmount, courseId, bankName = null, paymentGateway = 'jazzcash') => {
  try {
    // Call the backend API verification endpoint
    const api = (await import('./api')).default
    
    const response = await api.post('/payment/verify', {
      transactionId,
      expectedAmount,
      courseId,
      paymentGateway,
      bankName
    }, { includeAuth: false })
    
    return {
      success: true,
      verified: response.verified || false,
      transactionDetails: response.transactionDetails || null,
      message: response.message || ''
    }
  } catch (error) {
    console.error('Payment verification error:', error)
    // Don't fail completely - allow manual verification as fallback
    return {
      success: false,
      verified: false,
      error: error.message,
      message: 'Verification service unavailable - will require manual verification'
    }
  }
}

/**
 * Poll for payment verification status
 * Useful when payment gateway doesn't support webhooks or processes payments asynchronously
 */
export const pollPaymentStatus = async (transactionId, maxAttempts = 30, interval = 1000, expectedAmount = null, courseId = null) => {
  const api = (await import('./api')).default
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Use GET request to check payment status via backend API
      const params = new URLSearchParams({ transactionId })
      if (expectedAmount) {
        params.append('expectedAmount', expectedAmount.toString())
      }
      if (courseId) {
        params.append('courseId', courseId.toString())
      }
      
      const response = await api.get(`/payment/status?${params.toString()}`, { includeAuth: false })
      
      if (response.verified === true || response.status === 'verified' || response.status === 'completed') {
        return {
          success: true,
          verified: true,
          transactionId,
          verifiedAt: new Date().toISOString(),
          message: 'Payment verified successfully'
        }
      }
      
      if (response.status === 'failed' || response.status === 'rejected') {
        return {
          success: false,
          verified: false,
          reason: 'Payment rejected'
        }
      }
      
      // If status is still pending, continue polling
      if (response.status === 'pending') {
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, interval))
        continue
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, interval))
    } catch (error) {
      console.error(`Polling attempt ${attempt + 1} failed:`, error)
      // Wait before next attempt even on error
      await new Promise(resolve => setTimeout(resolve, interval))
    }
  }
  
  return {
    success: false,
    verified: false,
    reason: 'Verification timeout - payment may still be processing'
  }
}

/**
 * Setup webhook listener for payment gateway
 * This would typically be on the backend
 */
export const setupWebhookListener = (paymentGateway) => {
  // This is a client-side helper
  // Actual webhook should be on backend server
  
  const webhookEndpoints = {
    'jazzcash': '/api/payment/webhook',
    'easypaisa': '/api/payment/webhook',
    'stripe': '/api/payment/webhook',
    'paypal': '/api/payment/webhook',
    'bank-api': '/api/payment/webhook'
  }
  
  return webhookEndpoints[paymentGateway] || '/api/payment/webhook'
}

