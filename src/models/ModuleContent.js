const mongoose = require('mongoose');

const moduleContentSchema = new mongoose.Schema(
  {
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
      unique: true,
    },
    rawContent: {
      type: String,
      required: true,
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
    generatedBy: {
      type: String,
      enum: ['claude', 'manual', 'uploaded'],
      default: 'claude',
    },
  },
  { timestamps: true }
);

moduleContentSchema.index({ moduleId: 1 });

module.exports = mongoose.model('ModuleContent', moduleContentSchema);
