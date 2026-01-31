const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    default: '',
  },
  subject: {
    type: String,
    default: '',
  },
  message: {
    type: String,
    required: true,
  },
  formType: {
    type: String,
    enum: ['Contact', 'Job Application', 'Project Hiring'],
    default: 'Contact',
  },
  resume: {
    type: String, // File path or URL if file upload is implemented
    default: '',
  },
  coverLetter: {
    type: String,
    default: '',
  },
  companyName: {
    type: String,
    default: '',
  },
  contactPerson: {
    type: String,
    default: '',
  },
  projectDetails: {
    type: String,
    default: '',
  },
  contactTime: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Contact', contactSchema);

