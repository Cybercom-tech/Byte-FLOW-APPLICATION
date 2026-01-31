const Contact = require('../models/Contact');
const { sendContactEmail } = require('../services/emailService');

/**
 * Submit contact form
 */
const submitContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message, formType, resume, coverLetter, companyName, contactPerson, projectDetails, contactTime } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Save to database
    const contact = new Contact({
      name,
      email,
      phone: phone || '',
      subject: subject || '',
      message,
      formType: formType || 'Contact',
      resume: resume || '',
      coverLetter: coverLetter || '',
      companyName: companyName || '',
      contactPerson: contactPerson || '',
      projectDetails: projectDetails || '',
      contactTime: contactTime || '',
    });

    await contact.save();

    // Send email notification
    try {
      await sendContactEmail({
        name,
        email,
        phone,
        subject,
        message,
        formType: formType || 'Contact',
      });
    } catch (emailError) {
      console.error('Error sending contact email:', emailError);
      // Don't fail the request if email fails, but log it
    }

    res.status(200).json({
      message: 'Contact form submitted successfully',
      contact: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
      },
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ message: 'Error submitting contact form', error: error.message });
  }
};

/**
 * Get all contact submissions (admin only - optional)
 */
const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({ contacts });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ message: 'Error fetching contacts', error: error.message });
  }
};

module.exports = {
  submitContact,
  getContacts,
};

