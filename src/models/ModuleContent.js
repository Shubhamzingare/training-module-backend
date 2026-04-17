const mongoose = require('mongoose');

const moduleContentSchema = new mongoose.Schema(
  {
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
      unique: true,
    },
    keyPoints: [
      {
        type: String,
      },
    ],
    faqs: [
      {
        question: String,
        answer: String,
      },
    ],
    rawContent: {
      type: String,
    },
    generatedBy: {
      type: String,
      enum: ['claude', 'manual'],
      default: 'manual',
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

module.exports = mongoose.model('ModuleContent', moduleContentSchema);
