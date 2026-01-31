# Course Enrollment Email Setup

## Overview
When a student completes payment and enrolls in a course, an email notification is automatically sent to ByteFlow Innovations with all the enrollment details.

## Configuration

### 1. Update Email Address
Edit `forms/course-enrollment.php` and change the receiving email address:

```php
$receiving_email_address = 'info@byteflowinnovations.com';
```

Replace `info@byteflowinnovations.com` with the actual email address where you want to receive enrollment notifications.

### 2. Configure SMTP (Recommended)
For production use, uncomment and configure the SMTP settings in `forms/course-enrollment.php`:

```php
$enrollment->smtp = array(
  'host' => 'smtp.example.com',
  'username' => 'your-email@example.com',
  'password' => 'your-password',
  'port' => '587'
);
```

### 3. PHP Email Form Library
Make sure the PHP Email Form library is available at:
```
assets/vendor/php-email-form/php-email-form.php
```

If you don't have the library, you can:
- Purchase it from: https://bootstrapmade.com/php-email-form/
- Or use an alternative email solution (PHPMailer, SendGrid, etc.)

## Email Content

The email includes the following information:
- Student Name
- Student Email
- Student Phone
- Student Address
- Student City
- Course Title
- Course ID
- Course Price
- Total Amount Paid
- Payment Method
- Transaction ID
- Enrollment Date

## Testing

To test the email functionality:
1. Complete a course purchase through the checkout page
2. Check the configured email inbox for the enrollment notification
3. Verify all information is correctly included in the email

## Troubleshooting

### Email not sending
- Check PHP error logs
- Verify SMTP credentials (if using SMTP)
- Ensure the PHP Email Form library is installed
- Check server permissions for sending emails

### Email goes to spam
- Configure SPF/DKIM records for your domain
- Use a reputable SMTP service
- Ensure the "from" email address is valid

## Alternative Solutions

If PHP email doesn't work in your environment, you can:
1. Use a third-party email service (SendGrid, Mailgun, etc.)
2. Create an API endpoint that handles email sending
3. Use a service like EmailJS for client-side email sending
4. Integrate with a payment gateway that sends notifications

## Student Enrollment Storage

Student enrollments are currently stored in browser localStorage. In production, you should:
1. Store enrollments in a database
2. Create an API to manage enrollments
3. Update the `courseEnrollment.js` utility to use API calls instead of localStorage

