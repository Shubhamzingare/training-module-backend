const mongoose = require('mongoose');
const { TEST_STATUS } = require('../config/constants');

const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Test title is required'],
      trim: true,
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    totalMarks: {
      type: Number,
      required: [true, 'Total marks is required'],
      default: 100,
    },
    status: {
      type: String,
      enum: [TEST_STATUS.DRAFT, TEST_STATUS.PUBLISHED, TEST_STATUS.ARCHIVED],
      default: TEST_STATUS.DRAFT,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for faster queries
testSchema.index({ moduleId: 1 });
testSchema.index({ status: 1 });

module.exports = mongoose.model('Test', testSchema);
