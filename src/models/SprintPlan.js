const mongoose = require('mongoose');

const sprintPlanSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Sprint title is required'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  { timestamps: true }
);

// Auto-calculate endDate as startDate + 15 days
sprintPlanSchema.pre('save', function (next) {
  if (this.startDate && !this.endDate) {
    const endDate = new Date(this.startDate);
    endDate.setDate(endDate.getDate() + 15);
    this.endDate = endDate;
  }
  next();
});

sprintPlanSchema.index({ startDate: -1 });

module.exports = mongoose.model('SprintPlan', sprintPlanSchema);
