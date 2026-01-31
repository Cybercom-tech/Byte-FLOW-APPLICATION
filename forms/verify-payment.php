<?php
/**
 * Payment Verification API Endpoint
 * This endpoint verifies bank transfer payments automatically
 * 
 * Integration options:
 * 1. Payment Gateway APIs (JazzCash, EasyPaisa, Stripe, etc.)
 * 2. Bank APIs (if available)
 * 3. Transaction matching system
 * 4. Webhook handlers
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuration
$paymentGateway = 'jazzcash'; // Options: 'jazzcash', 'easypaisa', 'stripe', 'bank-api', 'manual'

/**
 * Verify payment using JazzCash API
 */
function verifyJazzCashPayment($transactionId, $expectedAmount) {
    // JazzCash API credentials (should be in environment variables)
    $merchantId = getenv('JAZZCASH_MERCHANT_ID') ?: 'your_merchant_id';
    $password = getenv('JAZZCASH_PASSWORD') ?: 'your_password';
    $apiUrl = 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchanttransactions';
    
    // Make API call to JazzCash
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'merchantId' => $merchantId,
        'password' => $password,
        'transactionId' => $transactionId
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $data = json_decode($response, true);
        
        // Verify transaction status and amount
        if (isset($data['status']) && $data['status'] === 'success') {
            if (isset($data['amount']) && floatval($data['amount']) >= floatval($expectedAmount)) {
                return [
                    'verified' => true,
                    'transactionId' => $transactionId,
                    'amount' => $data['amount'],
                    'verifiedAt' => date('Y-m-d H:i:s'),
                    'gateway' => 'jazzcash'
                ];
            }
        }
    }
    
    return ['verified' => false, 'reason' => 'Transaction not found or amount mismatch'];
}

/**
 * Verify payment using EasyPaisa API
 */
function verifyEasyPaisaPayment($transactionId, $expectedAmount) {
    // EasyPaisa API credentials
    $storeId = getenv('EASYPAISA_STORE_ID') ?: 'your_store_id';
    $apiKey = getenv('EASYPAISA_API_KEY') ?: 'your_api_key';
    $apiUrl = 'https://easypay.easypaisa.com.pk/easypay-service/rest/v4/transaction-status';
    
    // Make API call to EasyPaisa
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'storeId' => $storeId,
        'apiKey' => $apiKey,
        'orderId' => $transactionId
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $data = json_decode($response, true);
        
        if (isset($data['status']) && $data['status'] === 'paid') {
            if (isset($data['amount']) && floatval($data['amount']) >= floatval($expectedAmount)) {
                return [
                    'verified' => true,
                    'transactionId' => $transactionId,
                    'amount' => $data['amount'],
                    'verifiedAt' => date('Y-m-d H:i:s'),
                    'gateway' => 'easypaisa'
                ];
            }
        }
    }
    
    return ['verified' => false, 'reason' => 'Transaction not found or amount mismatch'];
}

/**
 * Verify payment using Bank API (if available)
 */
function verifyBankAPIPayment($transactionId, $expectedAmount, $bankName) {
    // This would integrate with bank APIs
    // Most banks in Pakistan don't provide public APIs
    // This is a placeholder for future integration
    
    // Example: HBL API, UBL API, etc.
    // Each bank would have different API structure
    
    return ['verified' => false, 'reason' => 'Bank API integration not available'];
}

/**
 * Verify payment using transaction matching
 * This matches transaction IDs and amounts from a database
 */
function verifyByTransactionMatching($transactionId, $expectedAmount) {
    // In production, this would query your database
    // where you store verified transactions from bank statements
    
    // Example database query (pseudo-code):
    // SELECT * FROM verified_transactions 
    // WHERE transaction_id = $transactionId 
    // AND amount >= $expectedAmount 
    // AND status = 'verified'
    
    // For now, return false (manual verification required)
    return ['verified' => false, 'reason' => 'Transaction matching not implemented'];
}

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Handle FormData (from fetch with FormData) or JSON
    if (!empty($_POST)) {
        // FormData was sent
        $transactionId = $_POST['transactionId'] ?? null;
        $expectedAmount = $_POST['expectedAmount'] ?? null;
        $courseId = $_POST['courseId'] ?? null;
        $paymentGateway = $_POST['paymentGateway'] ?? 'jazzcash';
        $bankName = $_POST['bankName'] ?? null;
    } else {
        // JSON was sent
        $input = json_decode(file_get_contents('php://input'), true);
        $transactionId = $input['transactionId'] ?? null;
        $expectedAmount = $input['expectedAmount'] ?? null;
        $courseId = $input['courseId'] ?? null;
        $paymentGateway = $input['paymentGateway'] ?? 'jazzcash';
        $bankName = $input['bankName'] ?? null;
    }
    
    if (!$transactionId || !$expectedAmount) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Missing required parameters'
        ]);
        exit();
    }
    
    // Verify payment based on selected gateway
    $verificationResult = ['verified' => false];
    
    switch ($paymentGateway) {
        case 'jazzcash':
            $verificationResult = verifyJazzCashPayment($transactionId, $expectedAmount);
            break;
            
        case 'easypaisa':
            $verificationResult = verifyEasyPaisaPayment($transactionId, $expectedAmount);
            break;
            
        case 'bank-api':
            $verificationResult = verifyBankAPIPayment($transactionId, $expectedAmount, $bankName);
            break;
            
        case 'transaction-matching':
            $verificationResult = verifyByTransactionMatching($transactionId, $expectedAmount);
            break;
            
        default:
            $verificationResult = ['verified' => false, 'reason' => 'Invalid payment gateway'];
    }
    
    if ($verificationResult['verified']) {
        // Payment verified - activate enrollment
        // In production, this would update the database
        // For now, return success
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'verified' => true,
            'transactionId' => $transactionId,
            'amount' => $verificationResult['amount'],
            'verifiedAt' => $verificationResult['verifiedAt'],
            'gateway' => $verificationResult['gateway'] ?? $paymentGateway,
            'message' => 'Payment verified successfully'
        ]);
    } else {
        http_response_code(200);
        echo json_encode([
            'success' => false,
            'verified' => false,
            'reason' => $verificationResult['reason'] ?? 'Verification failed',
            'message' => 'Payment verification failed. Manual verification required.'
        ]);
    }
    
    exit();
}

// Handle GET request (status check - for polling)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $transactionId = $_GET['transactionId'] ?? null;
    $expectedAmount = isset($_GET['expectedAmount']) ? floatval($_GET['expectedAmount']) : null;
    $courseId = $_GET['courseId'] ?? null;
    $paymentGateway = $_GET['paymentGateway'] ?? 'jazzcash';
    $bankName = $_GET['bankName'] ?? null;
    
    if (!$transactionId) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Missing transaction ID'
        ]);
        exit();
    }
    
    // Try to verify payment using the selected gateway
    $verificationResult = ['verified' => false, 'status' => 'pending'];
    
    // If no gateway specified, default to jazzcash
    if (!$paymentGateway) {
        $paymentGateway = 'jazzcash';
    }
    
    // Only attempt verification if we have the required parameters
    if ($expectedAmount) {
        switch ($paymentGateway) {
            case 'jazzcash':
                $verificationResult = verifyJazzCashPayment($transactionId, $expectedAmount);
                break;
                
            case 'easypaisa':
                $verificationResult = verifyEasyPaisaPayment($transactionId, $expectedAmount);
                break;
                
            case 'bank-api':
                if ($bankName) {
                    $verificationResult = verifyBankAPIPayment($transactionId, $expectedAmount, $bankName);
                } else {
                    $verificationResult = ['verified' => false, 'status' => 'pending', 'reason' => 'Bank name required for bank API'];
                }
                break;
                
            case 'transaction-matching':
                $verificationResult = verifyByTransactionMatching($transactionId, $expectedAmount);
                break;
                
            default:
                // Default behavior: return pending status
                $verificationResult = ['verified' => false, 'status' => 'pending', 'reason' => 'Payment gateway not configured'];
        }
    } else {
        // Without amount, we can't verify - just return pending status
        $verificationResult = ['verified' => false, 'status' => 'pending', 'reason' => 'Amount required for verification'];
    }
    
    // Return status
    if (isset($verificationResult['verified']) && $verificationResult['verified'] === true) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'verified' => true,
            'transactionId' => $transactionId,
            'status' => 'verified',
            'message' => 'Payment verified successfully'
        ]);
    } else {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'verified' => false,
            'transactionId' => $transactionId,
            'status' => 'pending',
            'message' => 'Payment verification pending',
            'reason' => $verificationResult['reason'] ?? 'Payment not yet verified'
        ]);
    }
    
    exit();
}

http_response_code(405);
echo json_encode([
    'success' => false,
    'error' => 'Method not allowed'
]);
?>

