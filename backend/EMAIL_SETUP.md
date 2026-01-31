# Email Configuration Guide

## Overview

The backend now includes email functionality using Nodemailer. All email forms have been migrated from PHP to the Node.js backend.

## Environment Variables

Add these to your `backend/.env` file:

```env
# SMTP Configuration (Required for production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@byteflowinnovations.com

# Email Recipients (Optional - defaults to SMTP_USER)
CONTACT_EMAIL=contact@byteflowinnovations.com
NEWSLETTER_EMAIL=newsletter@byteflowinnovations.com
ENROLLMENT_EMAIL=info@byteflowinnovations.com
```

## SMTP Providers

### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Use App Password, not regular password
```

**Note:** For Gmail, you need to:
1. Enable 2-Factor Authentication
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the App Password (not your regular password)

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

### Hostinger Email
```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-email-password
SMTP_FROM=your-email@yourdomain.com
```

**Hostinger SMTP Settings:**
- **Host:** `smtp.hostinger.com`
- **Port:** `465` (SSL) or `587` (TLS/STARTTLS)
- **Username:** Your full email address (e.g., `info@byteflowinnovations.com`)
- **Password:** Your email account password
- **Encryption:** SSL for port 465, TLS for port 587

**Important Notes for Hostinger:**
1. Use your **full email address** as the username (not just the part before @)
2. Use your **email account password** (the one you set in Hostinger email settings)
3. Port 465 uses SSL (secure: true)
4. Port 587 uses TLS (secure: false)
5. Make sure your domain MX records are properly configured in Hostinger

## Development Mode

If SMTP is not configured, the system will use a test account (emails won't actually send, but you'll get a preview URL in the console).

## Testing

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Test contact form:
   ```bash
   curl -X POST http://localhost:5000/api/contact/submit \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "email": "test@example.com",
       "subject": "Test",
       "message": "This is a test message"
     }'
   ```

3. Test newsletter subscription:
   ```bash
   curl -X POST http://localhost:5000/api/newsletter/subscribe \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}'
   ```

## Troubleshooting

### Emails not sending
- Check SMTP credentials are correct
- Verify SMTP_HOST and SMTP_PORT
- Check firewall/network settings
- Review backend console logs for errors

### Emails going to spam
- Configure SPF/DKIM records for your domain
- Use a reputable SMTP service (SendGrid, Mailgun)
- Ensure "from" email address is valid
- Avoid spam trigger words in subject/content

### Gmail authentication errors
- Make sure you're using an App Password (not regular password)
- Enable "Less secure app access" (if App Password not available)
- Check if 2FA is enabled

## API Endpoints

### Contact Form
- `POST /api/contact/submit` - Submit contact form
- `GET /api/contact/all` - Get all contacts (admin only)

### Newsletter
- `POST /api/newsletter/subscribe` - Subscribe to newsletter
- `POST /api/newsletter/unsubscribe` - Unsubscribe from newsletter
- `GET /api/newsletter/all` - Get all subscriptions (admin only)

### Enrollment Email
- `POST /api/payment/enrollment-email` - Send enrollment notification email

## Data Storage

All contact submissions and newsletter subscriptions are stored in MongoDB:
- `Contact` collection - Contact form submissions
- `Newsletter` collection - Newsletter subscriptions

