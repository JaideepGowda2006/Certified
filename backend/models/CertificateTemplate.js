const mongoose = require('mongoose');

const certificateTemplateSchema = new mongoose.Schema(
  {
    templateName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    templateJson: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'certificateTemplates',
  },
);

module.exports = mongoose.model('CertificateTemplate', certificateTemplateSchema);
