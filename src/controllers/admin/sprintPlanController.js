const SprintPlanService = require('../../services/admin/sprintPlanService');
const { ValidationError } = require('../../utils/errorTypes');

class SprintPlanController {
  async createSprintPlan(req, res, next) {
    try {
      const { title, startDate } = req.body;

      if (!title || !startDate) {
        throw new ValidationError('Title and start date are required');
      }

      const sprintPlan = await SprintPlanService.createSprintPlan(
        { title, startDate },
        req.user.id
      );

      res.status(201).json({
        success: true,
        message: 'Sprint plan created successfully',
        data: sprintPlan,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllSprintPlans(req, res, next) {
    try {
      const sprintPlans = await SprintPlanService.getAllSprintPlans();

      res.status(200).json({
        success: true,
        message: 'Sprint plans retrieved successfully',
        data: sprintPlans,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSprintPlanById(req, res, next) {
    try {
      const { id } = req.params;

      const sprintPlan = await SprintPlanService.getSprintPlanById(id);

      res.status(200).json({
        success: true,
        message: 'Sprint plan retrieved successfully',
        data: sprintPlan,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSprintPlan(req, res, next) {
    try {
      const { id } = req.params;
      const { title, startDate } = req.body;

      const sprintPlan = await SprintPlanService.updateSprintPlan(id, {
        title,
        startDate,
      });

      res.status(200).json({
        success: true,
        message: 'Sprint plan updated successfully',
        data: sprintPlan,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteSprintPlan(req, res, next) {
    try {
      const { id } = req.params;

      await SprintPlanService.deleteSprintPlan(id);

      res.status(200).json({
        success: true,
        message: 'Sprint plan deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SprintPlanController();
