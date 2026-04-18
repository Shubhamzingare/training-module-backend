const performanceService = require('../../services/performance/performanceService');

class UserPerformanceController {
  async getUserScores(req, res, next) {
    try {
      const { limit = 10, skip = 0, sort = '-attemptedAt' } = req.query;

      const result = await performanceService.getUserScores(
        { userId: req.user.id },
        { limit: parseInt(limit), skip: parseInt(skip), sort }
      );

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserProgress(req, res, next) {
    try {
      const progress = await performanceService.getUserProgress(req.user.id);

      res.status(200).json({
        success: true,
        data: progress,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserPerformanceController();
