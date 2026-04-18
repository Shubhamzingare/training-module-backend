const SprintPlan = require('../../models/SprintPlan');
const { NotFoundError, ValidationError } = require('../../utils/errors');

class SprintPlanService {
  static async createSprintPlan(data, userId) {
    const { title, startDate } = data;

    if (!title) {
      throw new ValidationError('Sprint title is required');
    }

    if (!startDate) {
      throw new ValidationError('Sprint start date is required');
    }

    const sprintPlan = new SprintPlan({
      title,
      startDate: new Date(startDate),
      createdBy: userId,
    });

    await sprintPlan.save();
    return sprintPlan;
  }

  static async getAllSprintPlans() {
    const sprints = await SprintPlan.find()
      .sort({ startDate: -1 })
      .populate('createdBy', 'name email');
    return sprints;
  }

  static async getSprintPlanById(sprintId) {
    const sprint = await SprintPlan.findById(sprintId).populate('createdBy', 'name email');
    if (!sprint) {
      throw new NotFoundError('Sprint plan not found');
    }
    return sprint;
  }

  static async updateSprintPlan(sprintId, data) {
    const { title, startDate } = data;

    const sprint = await SprintPlan.findByIdAndUpdate(
      sprintId,
      { title, startDate: startDate ? new Date(startDate) : undefined },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!sprint) {
      throw new NotFoundError('Sprint plan not found');
    }

    return sprint;
  }

  static async deleteSprintPlan(sprintId) {
    const sprint = await SprintPlan.findByIdAndDelete(sprintId);
    if (!sprint) {
      throw new NotFoundError('Sprint plan not found');
    }
    return sprint;
  }
}

module.exports = SprintPlanService;
