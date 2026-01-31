# Automatic Bank Transfer Verification Setup

## Overview
This guide explains how to set up automatic verification of bank transfers, so enrollments are activated automatically when payments are confirmed.

## Methods for Automatic Verification

### 1. Payment Gateway Integration (Recommended)

#### Option A: JazzCash Integration

**Setup Steps:**
1. Sign up for JazzCash Merchant Account: https://www.jazzcash.com.pk/merchant
2. Get your Merchant ID and Password
3. Configure webhook URL in JazzCash dashboard
4. Update environment variables:

```bash
JAZZCASH_MERCHANT_ID=your_merchant_id
JAZZCASH_PASSWORD=your_password
JAZZCASH_WEBHOOK_SECRET=your_webhook_secret
```

**How it works:**
- Student selects "Bank Transfer via JazzCash"
- Student is redirected to JazzCash payment page
- After payment, JazzCash sends webhook to your server
- Webhook handler verifies and activates enrollment automatically

**Webhook URL:** `https://yourdomain.com/forms/webhook-handler.php?gateway=jazzcash`

#### Option B: EasyPaisa Integration

**Setup Steps:**
1. Sign up for EasyPaisa Merchant Account: https://easypay.easypaisa.com.pk
2. Get your Store ID and API Key
3. Configure webhook URL in EasyPaisa dashboard
4. Update environment variables:

```bash
EASYPAISA_STORE_ID=your_store_id
EASYPAISA_API_KEY=your_api_key
EASYPAISA_WEBHOOK_SECRET=your_webhook_secret
```

**Webhook URL:** `https://yourdomain.com/forms/webhook-handler.php?gateway=easypaisa`

#### Option C: Stripe Integration (International)

**Setup Steps:**
1. Sign up for Stripe: https://stripe.com
2. Get your API keys
3. Configure webhook in Stripe dashboard
4. Update environment variables:

```bash
STRIPE_SECRET_KEY=your_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

**Webhook URL:** `https://yourdomain.com/forms/webhook-handler.php?gateway=stripe`

### 2. Bank API Integration

Some banks in Pakistan provide APIs for transaction verification:

**Available Bank APIs:**
- HBL (Habib Bank Limited) - Contact bank for API access
- UBL (United Bank Limited) - Contact bank for API access
- Bank Alfalah - Contact bank for API access
- Meezan Bank - Contact bank for API access

**Setup:**
1. Contact your bank for API credentials
2. Integrate with bank's API
3. Update `verify-payment.php` with bank API logic

### 3. Transaction Matching System

This method matches transaction IDs from bank statements:

**How it works:**
1. Export bank statements (CSV/Excel)
2. Upload to system or integrate bank statement API
3. System matches transaction IDs automatically
4. When match found, enrollment is activated

**Implementation:**
- Requires bank statement parsing
- Can be automated with scheduled jobs
- Most reliable for manual bank transfers

### 4. Payment Gateway with Bank Transfer Support

Some payment gateways support bank transfers with automatic verification:

**Options:**
- **Stripe** - Supports bank transfers in some countries
- **PayPal** - Supports bank transfers
- **Razorpay** - Supports bank transfers in India/Pakistan
- **Payoneer** - International bank transfers

## Implementation Steps

### Step 1: Choose Your Method

Decide which verification method to use based on:
- Your location (Pakistan vs International)
- Available payment gateways
- Bank API availability
- Budget and setup complexity

### Step 2: Configure Payment Gateway

1. Sign up for chosen payment gateway
2. Get API credentials
3. Configure webhook URL
4. Test in sandbox mode first

### Step 3: Update Environment Variables

Create a `.env` file or set environment variables:

```bash
# Payment Gateway
PAYMENT_GATEWAY=jazzcash  # Options: jazzcash, easypaisa, stripe, bank-api
JAZZCASH_MERCHANT_ID=your_merchant_id
JAZZCASH_PASSWORD=your_password
JAZZCASH_WEBHOOK_SECRET=your_webhook_secret

# Or for EasyPaisa
EASYPAISA_STORE_ID=your_store_id
EASYPAISA_API_KEY=your_api_key
EASYPAISA_WEBHOOK_SECRET=your_webhook_secret
```

### Step 4: Update Checkout Flow

The checkout already includes automatic verification attempts. You just need to:

1. Configure the payment gateway in `verify-payment.php`
2. Set up webhook handler at `/forms/webhook-handler.php`
3. Test the flow

### Step 5: Test Verification

1. Make a test payment
2. Check webhook is received
3. Verify enrollment is activated automatically
4. Check student receives confirmation

## How Automatic Verification Works

### Flow Diagram:

```
Student Submits Bank Transfer
    ↓
Enrollment Created (Pending)
    ↓
Payment Gateway Processes Payment
    ↓
Webhook Sent to Your Server
    ↓
Webhook Handler Verifies Payment
    ↓
Enrollment Status: Pending → Active
    ↓
Student Can Access Course
```

### Code Flow:

1. **Checkout Submission** (`Checkout.jsx`)
   - Student submits bank transfer form
   - Enrollment created with `pending` status
   - Automatic verification attempt starts

2. **Verification Attempt** (`paymentVerification.js`)
   - Calls `/forms/verify-payment.php`
   - Checks payment gateway for transaction status
   - If verified, activates enrollment

3. **Webhook Handler** (`webhook-handler.php`)
   - Receives webhook from payment gateway
   - Verifies webhook signature
   - Processes payment confirmation
   - Activates enrollment automatically

4. **Enrollment Activation** (`courseEnrollment.js`)
   - Status changes from `pending` to `active`
   - Student gains course access
   - Notification sent to student

## Security Considerations

### Webhook Security

1. **Verify Webhook Signatures**
   - Always verify webhook signatures
   - Use HMAC-SHA256 for signature verification
   - Store webhook secrets securely

2. **HTTPS Only**
   - Webhooks must use HTTPS
   - Never accept webhooks over HTTP

3. **Idempotency**
   - Handle duplicate webhooks
   - Check if enrollment already verified
   - Prevent double activation

### Transaction Verification

1. **Amount Verification**
   - Always verify payment amount matches
   - Prevent partial payment issues

2. **Transaction ID Validation**
   - Verify transaction IDs are unique
   - Check for duplicate transactions

3. **Time-based Verification**
   - Set expiration for pending enrollments
   - Auto-cancel if not verified within timeframe

## Testing

### Test Webhook Locally

Use tools like:
- **ngrok** - Expose local server to internet
- **Stripe CLI** - Test Stripe webhooks locally
- **Postman** - Test webhook endpoints

### Test Flow

1. Make test payment in sandbox mode
2. Check webhook is received
3. Verify enrollment activation
4. Test error scenarios

## Troubleshooting

### Webhook Not Received

- Check webhook URL is correct
- Verify webhook is enabled in payment gateway
- Check server logs for errors
- Test webhook endpoint manually

### Verification Fails

- Check API credentials are correct
- Verify transaction ID format
- Check amount matching
- Review error logs

### Enrollment Not Activated

- Check enrollment status in database
- Verify webhook handler is working
- Check for errors in logs
- Test verification function manually

## Production Checklist

- [ ] Payment gateway account created
- [ ] API credentials configured
- [ ] Webhook URL set up
- [ ] Webhook signature verification enabled
- [ ] HTTPS enabled
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Monitoring set up
- [ ] Tested in sandbox mode
- [ ] Tested with real payment
- [ ] Fallback to manual verification ready

## Recommended Setup for Pakistan

**Best Option:** JazzCash or EasyPaisa
- Widely used in Pakistan
- Good API documentation
- Webhook support
- Easy integration

**Alternative:** Bank API (if available)
- Direct bank integration
- More control
- Requires bank partnership

## Cost Considerations

- **JazzCash:** Transaction fees apply
- **EasyPaisa:** Transaction fees apply
- **Stripe:** International fees
- **Bank API:** May require partnership/contract

## Support

For payment gateway integration help:
- JazzCash: https://www.jazzcash.com.pk/support
- EasyPaisa: https://easypay.easypaisa.com.pk/support
- Stripe: https://stripe.com/docs/support

