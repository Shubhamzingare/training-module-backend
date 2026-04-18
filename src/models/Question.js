const mongoose = require('mongoose');

// Validation rules schema for advanced input validation
const validationRulesSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['email', 'number', 'url', 'regex', 'textLength', 'fileType', 'phone', 'custom'],
      default: null,
    },
    pattern: String, // For regex validation
    minValue: Number, // For number validation
    maxValue: Number,
    minLength: Number, // For text validation
    maxLength: Number,
    allowedFileTypes: [String], // For file type validation
    customMessage: String, // Error message to show user
  },
  { _id: false }
);

// Conditional logic schema for show/hide/require based on other responses
const conditionalLogicSchema = new mongoose.Schema(
  {
    id: String, // Unique ID for this condition
    triggerQuestionId: mongoose.Schema.Types.ObjectId, // Which question triggers this
    condition: {
      type: String,
      enum: ['equals', 'contains', 'greaterThan', 'lessThan', 'isEmpty', 'isNotEmpty'],
    },
    value: String, // Value to compare against
    targetQuestionId: mongoose.Schema.Types.ObjectId, // Which question to affect
    action: {
      type: String,
      enum: ['show', 'hide', 'require'],
    },
  },
  { _id: false }
);

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
    description: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: [
        'mcq',
        'checkbox',
        'dropdown',
        'linearScale',
        'shortAnswer',
        'paragraph',
        'date',
        'time',
        'fileUpload',
        'duration',
        'descriptive',
      ],
      required: true,
    },
    options: [
      {
        id: String,
        text: String,
        isCorrect: Boolean,
      },
    ],
    correctAnswer: {
      type: String,
    },
    correctAnswers: [String], // For checkbox type
    marks: {
      type: Number,
      required: true,
      default: 1,
    },
    order: {
      type: Number,
      default: 0,
    },
    // Question options/metadata
    isRequired: {
      type: Boolean,
      default: false,
    },
    questionImage: {
      type: String, // URL to image
      default: null,
    },
    shuffleOptions: {
      type: Boolean,
      default: false,
    },
    randomizeOrder: {
      type: Boolean,
      default: false,
    },
    showOtherOption: {
      type: Boolean,
      default: false,
    },
    // For linear scale
    scaleMin: {
      type: Number,
      default: 1,
    },
    scaleMax: {
      type: Number,
      default: 5,
    },
    scaleMinLabel: {
      type: String,
      default: '',
    },
    scaleMaxLabel: {
      type: String,
      default: '',
    },
    // For dropdown
    isMultiSelect: {
      type: Boolean,
      default: false,
    },
    // For file upload
    allowedFileTypes: [String], // e.g., ['pdf', 'doc', 'docx']
    maxFileSize: {
      type: Number, // in MB
      default: 10,
    },
    // For date/time
    defaultValue: {
      type: String,
      default: null,
    },
    // Google Forms Features - Answer Key & Feedback
    answerKey: {
      type: String,
      default: '',
    },
    feedback: {
      type: String,
      default: '',
    },
    // Google Forms Features - Advanced Validation
    validationRules: validationRulesSchema,
    // Google Forms Features - Conditional Logic
    conditionalLogic: [conditionalLogicSchema],
    // Google Forms Features - Section Organization
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      default: null,
    },
    // Google Forms Features - Page Break
    pageBreak: {
      type: Boolean,
      default: false,
    },
    // Google Forms Features - Media Support
    imageUrl: {
      type: String,
      default: null,
    },
    videoUrl: {
      type: String,
      default: null,
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
  { timestamps: false }
);

questionSchema.index({ testId: 1, order: 1 });
questionSchema.index({ sectionId: 1 });
questionSchema.index({ 'conditionalLogic.triggerQuestionId': 1 });

module.exports = mongoose.model('Question', questionSchema);
