const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    action: {
      type: String,
      enum: ['login', 'logout', 'create', 'update', 'delete', 'view'],
      required: true,
    },
    resource: {
      type: String,
      enum: ['admin', 'department', 'shift', 'category', 'topic', 'module', 'test', 'question', 'performance'],
    },
    resourceId: mongoose.Schema.Types.ObjectId,
    ipAddress: String,
    userAgent: String,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false }
);

// Index for faster queries
adminLogSchema.index({ adminId: 1, timestamp: -1 });
adminLogSchema.index({ action: 1 });

module.exports = mongoose.model('AdminLog', adminLogSchema);
