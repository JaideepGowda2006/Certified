const mongoose = require('mongoose');

const scanLogSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      default: 'Unknown',
    },
    device: {
      type: String,
      default: 'Unknown',
    },
    browser: {
      type: String,
      default: 'Unknown',
    },
    country: {
      type: String,
      default: 'Unknown',
    },
    city: {
      type: String,
      default: 'Unknown',
    },
    scannedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  },
);

module.exports = mongoose.model('ScanLog', scanLogSchema);
