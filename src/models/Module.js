const mongoose = require('mongoose');

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
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: false,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    fileUrl: {
      type: String,
      required: false,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'video'],
      required: true,
    },
    sprintPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SprintPlan',
    },
    demoDate: {
      type: Date,
      required: false,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'locked', 'draft'],
      default: 'draft',
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  { timestamps: true }
);

moduleSchema.index({ categoryId: 1, topicId: 1, status: 1 });
moduleSchema.index({ sprintPlanId: 1 });

module.exports = mongoose.model('Module', moduleSchema);
