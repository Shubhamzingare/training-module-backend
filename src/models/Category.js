const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      default: '📚',
    },
    type: {
      type: String,
      enum: ['wati_training', 'new_deployment', 'other'],
      default: 'wati_training',
    },
    order: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  { timestamps: true }
);

categorySchema.index({ type: 1 });

module.exports = mongoose.model('Category', categorySchema);
