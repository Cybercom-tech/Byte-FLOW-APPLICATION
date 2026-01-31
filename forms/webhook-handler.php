<?php
/**
 * Webhook Handler for Payment Gateways
 * Receives webhooks from payment gateways when payments are completed
 * 
 * Supported gateways:
 * - JazzCash
 * - EasyPaisa
 * - Stripe
 * - PayPal
 * - Bank webhooks (if available)
 */

header('Content-Type: application/json');

// Get webhook data
$payload = file_get_contents('php://input');
$headers = getallheaders();
$signature = $headers['X-Webhook-Signature'] ?? null;

// Determine which gateway sent the webhook
$gateway = $_GET['gateway'] ?? 'unknown';

/**
 * Verify webhook signature (security)
 */
function verifyWebhookSignature($payload, $signature, $gateway) {
    $secretKey = getenv(strtoupper($gateway) . '_WEBHOOK_SECRET') ?: '';
    
    switch ($gateway) {
        case 'jazzcash':
            $expectedSignature = hash_hmac('sha256', $payload, $secretKey);
            return hash_equals($expectedSignature, $signature);
            
        case 'easypaisa':
            $expectedSignature = hash_hmac('sha256', $payload, $secretKey);
            return hash_equals($expectedSignature, $signature);
            
        case 'stripe':
            // Stripe signature verification
            return true; // Implement Stripe signature verification
            
        default:
            return false;
    }
}

/**
 * Process JazzCash webhook
 */
function processJazzCashWebhook($data) {
    // JazzCash webhook structure
    $transactionId = $data['pp_TxnRefNo'] ?? null;
    $amount = $data['pp_Amount'] ?? null;
    $status = $data['pp_ResponseCode'] ?? null;
    $courseId = $data['pp_Description'] ?? null; // Course ID in description
    
    if ($status === '000' && $transactionId && $amount) {
        return [
            'success' => true,
            'transactionId' => $transactionId,
            'amount' => $amount,
            'status' => 'verified',
            'courseId' => $courseId,
            'gateway' => 'jazzcash'
        ];
    }
    
    return ['success' => false, 'reason' => 'Invalid webhook data'];
}

/**
 * Process EasyPaisa webhook
 */
function processEasyPaisaWebhook($data) {
    $transactionId = $data['orderId'] ?? null;
    $amount = $data['amount'] ?? null;
    $status = $data['status'] ?? null;
    $courseId = $data['courseId'] ?? null;
    
    if ($status === 'paid' && $transactionId && $amount) {
        return [
            'success' => true,
            'transactionId' => $transactionId,
            'amount' => $amount,
            'status' => 'verified',
            'courseId' => $courseId,
            'gateway' => 'easypaisa'
        ];
    }
    
    return ['success' => false, 'reason' => 'Invalid webhook data'];
}

/**
 * Process Stripe webhook
 */
function processStripeWebhook($data) {
    $eventType = $data['type'] ?? null;
    
    if ($eventType === 'payment_intent.succeeded') {
        $paymentIntent = $data['data']['object'];
        $transactionId = $paymentIntent['id'];
        $amount = $paymentIntent['amount'] / 100; // Convert from cents
        $metadata = $paymentIntent['metadata'] ?? [];
        $courseId = $metadata['courseId'] ?? null;
        
        return [
            'success' => true,
            'transactionId' => $transactionId,
            'amount' => $amount,
            'status' => 'verified',
            'courseId' => $courseId,
            'gateway' => 'stripe'
        ];
    }
    
    return ['success' => false, 'reason' => 'Event type not handled'];
}

// Verify webhook signature
if ($signature && !verifyWebhookSignature($payload, $signature, $gateway)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid webhook signature']);
    exit();
}

// Parse webhook data
$data = json_decode($payload, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid webhook data']);
    exit();
}

// Process webhook based on gateway
$result = ['success' => false];

switch ($gateway) {
    case 'jazzcash':
        $result = processJazzCashWebhook($data);
        break;
        
    case 'easypaisa':
        $result = processEasyPaisaWebhook($data);
        break;
        
    case 'stripe':
        $result = processStripeWebhook($data);
        break;
        
    default:
        $result = ['success' => false, 'reason' => 'Unknown gateway'];
}

if ($result['success']) {
    // Payment verified - activate enrollment
    // In production, this would:
    // 1. Update enrollment status in database
    // 2. Send confirmation email to student
    // 3. Log the verification
    
    // For now, just return success
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Webhook processed successfully',
        'transactionId' => $result['transactionId'],
        'courseId' => $result['courseId']
    ]);
} else {
    http_response_code(200);
    echo json_encode([
        'success' => false,
        'message' => 'Webhook processing failed',
        'reason' => $result['reason']
    ]);
}
?>

