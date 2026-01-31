# Bank Transfer Payment Flow

## Overview
Bank transfers are **NOT** processed automatically. They require manual verification by ByteFlow before the student is enrolled in the course.

## How Bank Transfers Work

### 1. Student Submits Payment
- Student selects "Bank Transfer" as payment method
- Student enters their bank name and transaction ID/reference number
- Student submits the checkout form

### 2. Pending Enrollment Created
- A **pending enrollment** is created in the system (status: `pending`)
- Student receives a **pending verification** message
- Student CANNOT access the course content yet

### 3. Email Notification Sent to ByteFlow
- An email is automatically sent to ByteFlow with:
  - ⚠️ **VERIFICATION REQUIRED** in the subject line
  - Student information (name, email, phone, address)
  - Course details
  - Payment amount and transaction ID
  - Student's bank name
  - **Action required notice**: ByteFlow must verify the payment

### 4. ByteFlow Verification Process
**ByteFlow must manually:**
1. Check their bank account for the payment
2. Verify the transaction ID matches
3. Verify the amount matches the course price
4. Activate the enrollment in the admin panel (or database)

### 5. Enrollment Activation
Once ByteFlow verifies the payment:
- Enrollment status changes from `pending` to `active`
- Student receives email confirmation
- Student can now access the course content
- Course appears in student's dashboard with full access

## Key Differences: Bank Transfer vs Card Payment

### Card Payment
- ✅ **Immediate enrollment** - Student is enrolled right away
- ✅ **Automatic verification** - Payment is verified instantly
- ✅ **Full access** - Student can access course immediately
- ✅ Email sent to ByteFlow with ✅ confirmation

### Bank Transfer
- ⏳ **Pending enrollment** - Student must wait for verification
- ⏳ **Manual verification** - ByteFlow must verify payment manually
- ⏳ **No access** - Student cannot access course until verified
- ⏳ Email sent to ByteFlow with ⚠️ verification required notice
- ⏳ Verification typically takes 1-3 business days

## Student Experience

### After Submitting Bank Transfer:
1. Student sees "Payment Submitted Successfully" message
2. Student sees "Pending Verification" status
3. Student receives transaction ID for reference
4. Student sees instructions about verification process
5. Student's dashboard shows course as "Pending Verification"

### Pending Enrollment Display:
- Shows in a separate "Pending Enrollments" section
- Yellow/warning color scheme
- Displays transaction ID
- Shows payment method (Bank Transfer)
- Message: "Your enrollment is pending verification"

### After Verification:
- Course moves to "Active Courses" section
- Student can access course content
- Progress tracking begins
- Student receives email confirmation

## Email to ByteFlow

### For Bank Transfers:
**Subject:** ⚠️ VERIFICATION REQUIRED: Bank Transfer Enrollment - [Course Title]

**Content includes:**
- Student information
- Course details
- Payment amount
- Transaction ID
- Student's bank name
- **VERIFICATION REQUIRED** notice
- Action required message

### For Card Payments:
**Subject:** ✅ New Course Enrollment: [Course Title]

**Content includes:**
- Student information
- Course details
- Payment amount
- Transaction ID
- Confirmation that payment was processed

## Technical Implementation

### Enrollment Status
- `pending`: Bank transfer submitted, awaiting verification
- `active`: Payment verified, student has full access

### Storage
- Enrollments stored in localStorage (development)
- In production, should be stored in database
- Pending enrollments have `status: 'pending'`
- Active enrollments have `status: 'active'`

### Verification Function
- `verifyEnrollment(courseId)` - Changes status from pending to active
- This function should be called by admin after verifying payment
- In production, this would be an admin panel function

## Admin Actions Required

1. **Monitor Email** - Check for verification required emails
2. **Verify Payment** - Check bank account for payment
3. **Match Transaction ID** - Verify transaction ID matches
4. **Verify Amount** - Confirm amount matches course price
5. **Activate Enrollment** - Change enrollment status to active
6. **Notify Student** - Send confirmation email (automatic)

## Production Recommendations

1. **Admin Panel** - Create an admin panel to manage pending enrollments
2. **Database Integration** - Store enrollments in database instead of localStorage
3. **Automated Notifications** - Set up automated email notifications
4. **Payment Gateway Integration** - Consider integrating with payment gateways that support bank transfers
5. **Webhook Support** - If using payment gateway, set up webhooks for automatic verification
6. **Transaction Tracking** - Implement transaction tracking system
7. **Audit Log** - Keep audit log of all verification actions

## Security Considerations

1. **Transaction ID Validation** - Verify transaction IDs are unique
2. **Amount Verification** - Always verify payment amount matches
3. **Duplicate Prevention** - Prevent duplicate enrollments
4. **Fraud Detection** - Monitor for suspicious transactions
5. **Secure Storage** - Store sensitive payment information securely

## Testing

To test the bank transfer flow:
1. Select "Bank Transfer" as payment method
2. Enter bank name and transaction ID
3. Submit the form
4. Check that enrollment is created with `pending` status
5. Check that email is sent to ByteFlow with verification required notice
6. Verify student dashboard shows pending enrollment
7. Manually verify enrollment (change status to active)
8. Verify student can access course after verification

