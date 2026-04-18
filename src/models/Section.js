const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Section title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    // Section settings
    pageBreakBefore: {
      type: Boolean,
      default: false,
    },
    pageBreakAfter: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

sectionSchema.index({ testId: 1, order: 1 });
sectionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Section', sectionSchema);
