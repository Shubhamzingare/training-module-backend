const moduleService = require('../../services/module/moduleService');

class UserModuleController {
  async listModules(req, res, next) {
    try {
      const { type, limit = 10, skip = 0, sort = '-createdAt' } = req.query;

      // Only show active modules to users
      const result = await moduleService.listModules(
        { type, status: 'active' },
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

  async getModule(req, res, next) {
    try {
      const module = await moduleService.getModuleById(req.params.id);

      // Check if module is active
      if (module.status !== 'active') {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Module is not available',
            statusCode: 403,
          },
        });
      }

      res.status(200).json({
        success: true,
        data: module,
      });
    } catch (error) {
      next(error);
    }
  }

  async getModuleContent(req, res, next) {
    try {
      const content = await moduleService.getModuleContent(req.params.id);

      res.status(200).json({
        success: true,
        data: {
          keyPoints: content.keyPoints,
          faqs: content.faqs,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserModuleController();
