const mongoose = require('mongoose');

const batchMemberSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Prevent duplicate assignments
batchMemberSchema.index({ batchId: 1, userId: 1 }, { unique: true });
batchMemberSchema.index({ batchId: 1, moduleId: 1 });

module.exports = mongoose.model('BatchMember', batchMemberSchema);
