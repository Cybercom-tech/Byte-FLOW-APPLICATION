const nodemailer = require('nodemailer');

/**
 * Create email transporter
 * Uses SMTP configuration from environment variables
 */
const createTransporter = () => {
  // If SMTP is configured, use it. Otherwise, use a test account
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = parseInt(process.env.SMTP_PORT) || 587;
    const secure = port === 465; // Port 465 uses SSL, others use TLS
    
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: secure, // true for 465 (SSL), false for 587 (TLS)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Additional options for better compatibility
      tls: {
        // Do not fail on invalid certs (useful for some providers)
        rejectUnauthorized: false
      }
    });
  } else {
    // For development: use a test account (emails won't actually send)
    // In production, you MUST configure SMTP
    console.warn('⚠️  SMTP not configured. Using test account. Emails will not be sent.');
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'test@ethereal.email',
        pass: 'test',
      },
    });
  }
};

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email body
 * @param {string} options.text - Plain text email body (optional)
 * @param {string} options.from - Sender email (optional)
 * @param {string} options.fromName - Sender name (optional)
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    const fromEmail = options.from || process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@byteflowinnovations.com';
    const fromName = options.fromName || 'ByteFlow Innovations';
    
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);
    
    // In development with test account, log the preview URL
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
      console.log('📧 Email sent (test mode):', nodemailer.getTestMessageUrl(info));
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send contact form email
 */
const sendContactEmail = async (contactData) => {
  const { name, email, phone, subject, message, formType = 'Contact' } = contactData;
  
  const receivingEmail = process.env.CONTACT_EMAIL || process.env.SMTP_USER || 'info@byteflowinnovations.com';
  
  const html = `
    <h2>New ${formType} Submission</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
    ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
    <p><strong>Message:</strong></p>
    <p>${message.replace(/\n/g, '<br>')}</p>
    <hr>
    <p><small>Submitted on: ${new Date().toLocaleString()}</small></p>
  `;
  
  return await sendEmail({
    to: receivingEmail,
    subject: `${formType}: ${subject || 'New Submission'}`,
    html,
    from: email,
    fromName: name,
  });
};

/**
 * Send newsletter subscription email
 */
const sendNewsletterEmail = async (email) => {
  const receivingEmail = process.env.NEWSLETTER_EMAIL || process.env.SMTP_USER || 'info@byteflowinnovations.com';
  
  const html = `
    <h2>New Newsletter Subscription</h2>
    <p><strong>Email:</strong> ${email}</p>
    <p><small>Subscribed on: ${new Date().toLocaleString()}</small></p>
  `;
  
  return await sendEmail({
    to: receivingEmail,
    subject: `New Newsletter Subscription: ${email}`,
    html,
  });
};

/**
 * Send course enrollment notification email
 */
const sendEnrollmentEmail = async (enrollmentData) => {
  const {
    studentName,
    studentEmail,
    studentPhone,
    studentAddress,
    studentCity,
    courseTitle,
    courseId,
    coursePrice,
    totalAmount,
    paymentMethod,
    transactionId,
    bankName,
    requiresVerification,
  } = enrollmentData;
  
  const receivingEmail = process.env.ENROLLMENT_EMAIL || process.env.SMTP_USER || 'info@byteflowinnovations.com';
  
  const subject = requiresVerification
    ? `⚠️ VERIFICATION REQUIRED: Bank Transfer Enrollment - ${courseTitle}`
    : `✅ New Course Enrollment: ${courseTitle}`;
  
  const html = `
    <h2>${requiresVerification ? '⚠️ VERIFICATION REQUIRED' : '✅ New Course Enrollment'}</h2>
    
    <h3>Student Information</h3>
    <p><strong>Name:</strong> ${studentName || 'N/A'}</p>
    <p><strong>Email:</strong> ${studentEmail || 'N/A'}</p>
    <p><strong>Phone:</strong> ${studentPhone || 'N/A'}</p>
    <p><strong>Address:</strong> ${studentAddress || 'N/A'}</p>
    <p><strong>City:</strong> ${studentCity || 'N/A'}</p>
    
    <h3>Course Information</h3>
    <p><strong>Course Title:</strong> ${courseTitle || 'N/A'}</p>
    <p><strong>Course ID:</strong> ${courseId || 'N/A'}</p>
    <p><strong>Course Price:</strong> PKR ${coursePrice ? Number(coursePrice).toLocaleString() : 'N/A'}</p>
    
    <h3>Payment Information</h3>
    <p><strong>Total Amount Paid:</strong> PKR ${totalAmount ? Number(totalAmount).toLocaleString() : 'N/A'}</p>
    <p><strong>Payment Method:</strong> ${paymentMethod || 'N/A'}</p>
    <p><strong>Transaction ID:</strong> ${transactionId || 'N/A'}</p>
    ${bankName ? `<p><strong>Student Bank Name:</strong> ${bankName}</p>` : ''}
    <p><strong>Enrollment Date:</strong> ${new Date().toLocaleString()}</p>
    
    ${requiresVerification ? `
      <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <h3>⚠️ ACTION REQUIRED</h3>
        <p>Please verify the bank transfer payment and activate this enrollment in the admin panel.</p>
        <p><strong>Note:</strong> Student cannot access the course until payment is verified and enrollment is activated.</p>
      </div>
    ` : ''}
    
    <hr>
    <p><small>Enrollment submitted on: ${new Date().toLocaleString()}</small></p>
  `;
  
  return await sendEmail({
    to: receivingEmail,
    subject,
    html,
    from: studentEmail,
    fromName: studentName,
  });
};

module.exports = {
  sendEmail,
  sendContactEmail,
  sendNewsletterEmail,
  sendEnrollmentEmail,
};

