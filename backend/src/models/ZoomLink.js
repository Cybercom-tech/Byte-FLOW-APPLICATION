const mongoose = require("mongoose");

const zoomLinkSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    unique: true
  },
  zoomLink: {
    type: String,
    required: true
  },
  meetingId: {
    type: String,
    default: ""
  },
  password: {
    type: String,
    default: ""
  },
  date: {
    type: String,
    default: ""
  },
  time: {
    type: String,
    default: ""
  }
}, { timestamps: true });

module.exports = mongoose.model("ZoomLink", zoomLinkSchema);

