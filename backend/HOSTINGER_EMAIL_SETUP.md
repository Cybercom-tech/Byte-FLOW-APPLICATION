# Hostinger Email Setup Guide

## Quick Setup for Hostinger Email

If you have a Hostinger email account (e.g., `info@byteflowinnovations.com`), here's how to configure it:

### Step 1: Get Your Email Credentials

1. Log in to your **Hostinger hPanel**
2. Go to **Email** section
3. Find your email account (e.g., `info@byteflowinnovations.com`)
4. Note your email address and password

### Step 2: Configure `.env` File

Add these settings to `backend/.env`:

```env
# Hostinger Email SMTP Configuration
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=info@byteflowinnovations.com
SMTP_PASS=your-email-password
SMTP_FROM=info@byteflowinnovations.com

# Optional - Custom recipient emails
CONTACT_EMAIL=contact@byteflowinnovations.com
NEWSLETTER_EMAIL=newsletter@byteflowinnovations.com
ENROLLMENT_EMAIL=info@byteflowinnovations.com
```

### Step 3: Port Options

**Option 1: Port 465 (SSL) - Recommended**
```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
```
- Uses SSL encryption
- More secure
- Recommended for production

**Option 2: Port 587 (TLS)**
```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
```
- Uses TLS/STARTTLS encryption
- Alternative if port 465 doesn't work

### Step 4: Important Notes

1. **Username:** Use your **full email address** (e.g., `info@byteflowinnovations.com`)
   - ❌ Wrong: `info`
   - ✅ Correct: `info@byteflowinnovations.com`

2. **Password:** Use the password you set when creating the email account in Hostinger

3. **Domain Setup:** Make sure your domain's MX records are properly configured in Hostinger

4. **Testing:** After configuration, test by submitting a contact form or newsletter subscription

### Step 5: Verify Configuration

1. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Submit a test contact form from your frontend

3. Check the backend console for any errors

4. Check the recipient email inbox for the message

### Troubleshooting

#### "Authentication failed" error
- ✅ Verify you're using the **full email address** as username
- ✅ Check that the password is correct
- ✅ Make sure the email account is active in Hostinger

#### "Connection timeout" error
- ✅ Check if port 465 is blocked by firewall
- ✅ Try port 587 instead
- ✅ Verify `smtp.hostinger.com` is accessible

#### "Emails not received"
- ✅ Check spam/junk folder
- ✅ Verify recipient email address is correct
- ✅ Check backend console for error messages
- ✅ Verify MX records are set up correctly in Hostinger

#### "Invalid login" error
- ✅ Make sure you're using the email account password (not hPanel password)
- ✅ Try resetting the email password in Hostinger
- ✅ Verify the email account exists and is active

### Example Configuration

**For `info@byteflowinnovations.com`:**
```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=info@byteflowinnovations.com
SMTP_PASS=YourSecurePassword123
SMTP_FROM=info@byteflowinnovations.com
CONTACT_EMAIL=info@byteflowinnovations.com
NEWSLETTER_EMAIL=info@byteflowinnovations.com
ENROLLMENT_EMAIL=info@byteflowinnovations.com
```

### Multiple Email Accounts

If you have multiple Hostinger email accounts, you can use different ones for different purposes:

```env
# Main sending account
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=noreply@byteflowinnovations.com
SMTP_PASS=password-for-noreply

# Different recipients
CONTACT_EMAIL=contact@byteflowinnovations.com
NEWSLETTER_EMAIL=marketing@byteflowinnovations.com
ENROLLMENT_EMAIL=info@byteflowinnovations.com
```

### Security Best Practices

1. ✅ Never commit `.env` file to git
2. ✅ Use strong passwords for email accounts
3. ✅ Enable 2FA on your Hostinger account if available
4. ✅ Regularly update email passwords
5. ✅ Monitor email sending for suspicious activity

### Testing Commands

Test the email configuration:

```bash
# Test contact form
curl -X POST http://localhost:5000/api/contact/submit \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subject": "Test Email",
    "message": "Testing Hostinger email configuration"
  }'

# Test newsletter
curl -X POST http://localhost:5000/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

---

**Need Help?**
- Hostinger Support: https://www.hostinger.com/contact
- Check Hostinger Email Documentation: https://support.hostinger.com/en/articles/1575756-how-to-get-email-account-configuration-details-for-hostinger-email

