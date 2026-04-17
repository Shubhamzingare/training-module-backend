const mongoose = require('mongoose');
const { MODULE_TYPES, MODULE_STATUS, PODS } = require('../config/constants');

const moduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: [MODULE_TYPES.NEW_DEPLOYMENT, MODULE_TYPES.WATI_TRAINING],
      required: [true, 'Module type is required'],
    },
    podName: {
      type: String,
      enum: PODS,
      required: function () {
        return this.type === MODULE_TYPES.NEW_DEPLOYMENT;
      },
    },
    status: {
      type: String,
      enum: [MODULE_STATUS.ACTIVE, MODULE_STATUS.INACTIVE, MODULE_STATUS.DRAFT],
      default: MODULE_STATUS.DRAFT,
    },
    sourceFileUrl: {
      type: String,
      required: [true, 'Source file URL is required'],
    },
    sourceFileType: {
      type: String,
      enum: ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'figma'],
      required: [true, 'Source file type is required'],
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
moduleSchema.index({ type: 1, status: 1 });
moduleSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Module', moduleSchema);
