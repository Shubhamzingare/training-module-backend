const mongoose = require('mongoose');
const { ATTEMPT_STATUS } = require('../config/constants');

const testAttemptSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    answers: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        userAnswer: String,
        isCorrect: Boolean,
        marksObtained: Number,
      },
    ],
    marksObtained: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [ATTEMPT_STATUS.IN_PROGRESS, ATTEMPT_STATUS.COMPLETED, ATTEMPT_STATUS.SUBMITTED],
      default: ATTEMPT_STATUS.IN_PROGRESS,
    },
    attemptedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    feedback: {
      type: String,
    },
  },
  { timestamps: true }
);

// Index for faster queries
testAttemptSchema.index({ userId: 1, testId: 1 });
testAttemptSchema.index({ status: 1 });

module.exports = mongoose.model('TestAttempt', testAttemptSchema);
