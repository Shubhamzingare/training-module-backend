const mongoose = require('mongoose');
const { QUESTION_TYPES } = require('../config/constants');

const questionSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
    },
    type: {
      type: String,
      enum: [QUESTION_TYPES.MCQ, QUESTION_TYPES.DESCRIPTIVE],
      required: [true, 'Question type is required'],
    },
    options: [
      {
        text: String,
        isCorrect: Boolean,
      },
    ],
    correctAnswer: {
      type: String,
      required: function () {
        return this.type === QUESTION_TYPES.MCQ;
      },
    },
    marks: {
      type: Number,
      required: [true, 'Marks is required'],
      default: 1,
    },
    order: {
      type: Number,
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
questionSchema.index({ testId: 1, order: 1 });

module.exports = mongoose.model('Question', questionSchema);
