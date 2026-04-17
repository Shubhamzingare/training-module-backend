const mongoose = require('mongoose');
const { BATCH_TYPES } = require('../config/constants');

const batchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Batch name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: [BATCH_TYPES.NEW_HIRES, BATCH_TYPES.EXISTING_TEAM, BATCH_TYPES.SPECIFIC_TEAM],
      required: [true, 'Batch type is required'],
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
batchSchema.index({ type: 1 });
batchSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Batch', batchSchema);
