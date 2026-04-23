const mongoose = require('mongoose');

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
      required: false,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: false,
    },
    moduleType: {
      type: String,
      enum: ['wati_training', 'new_deployment', ''],
      default: '',
    },
    description: {
      type: String,
      trim: true,
    },
    totalMarks: {
      type: Number,
      required: true,
      default: 100,
    },
    passingMarks: {
      type: Number,
      default: 50,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'locked'],
      default: 'draft',
    },
    timeLimit: {
      type: Number,
      default: 60, // in minutes
    },
    googleFormUrl: {
      type: String,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    // Google Forms Features - Question & Option Shuffling
    shuffleQuestions: {
      type: Boolean,
      default: false,
    },
    shuffleOptions: {
      type: Boolean,
      default: false,
    },
    // Google Forms Features - Response Handling
    allowMultipleAttempts: {
      type: Boolean,
      default: false,
    },
    maxAttempts: {
      type: Number,
      default: null, // null means unlimited
    },
    // Google Forms Features - Response Visibility
    responseVisibility: {
      type: String,
      enum: ['score_only', 'score_and_answers', 'full_feedback'],
      default: 'score_only',
    },
    // Google Forms Features - Auto Submit
    autoSubmitOnTimeEnd: {
      type: Boolean,
      default: false,
    },
    // Google Forms Features - Feedback
    feedbackText: {
      type: String,
      default: '',
    },
    // Google Forms Features - User Info Collection
    requireEmail: {
      type: Boolean,
      default: false,
    },
    // Google Forms Features - UI Options
    showProgressBar: {
      type: Boolean,
      default: true,
    },
    randomizeQuestionOrder: {
      type: Boolean,
      default: false,
    },
    // Tracking settings changes
    settingsUpdatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

testSchema.index({ moduleId: 1, status: 1 });
testSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model('Test', testSchema);
