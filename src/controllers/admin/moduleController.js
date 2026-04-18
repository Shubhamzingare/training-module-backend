const moduleService = require('../../services/module/moduleService');
const { ValidationError } = require('../../utils/errorTypes');

class ModuleController {
  async createModule(req, res, next) {
    try {
      const { title, description, type, podName, sourceFileUrl, sourceFileType } = req.body;

      if (!title || !type || !sourceFileUrl || !sourceFileType) {
        throw new ValidationError(
          'Title, type, sourceFileUrl, and sourceFileType are required'
        );
      }

      const module = await moduleService.createModule(
        {
          title,
          description,
          type,
          podName,
          sourceFileUrl,
          sourceFileType,
        },
        req.user.id
      );

      res.status(201).json({
        success: true,
        message: 'Module created successfully',
        data: module,
      });
    } catch (error) {
      next(error);
    }
  }

  async listModules(req, res, next) {
    try {
      const { type, status, limit = 10, skip = 0, sort = '-createdAt' } =
        req.query;

      const result = await moduleService.listModules(
        { type, status },
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

      res.status(200).json({
        success: true,
        data: module,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateModule(req, res, next) {
    try {
      const module = await moduleService.updateModule(req.params.id, req.body);

      res.status(200).json({
        success: true,
        message: 'Module updated successfully',
        data: module,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteModule(req, res, next) {
    try {
      const module = await moduleService.deleteModule(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Module deleted successfully',
        data: module,
      });
    } catch (error) {
      next(error);
    }
  }

  async activateModule(req, res, next) {
    try {
      const module = await moduleService.activateModule(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Module activated successfully',
        data: module,
      });
    } catch (error) {
      next(error);
    }
  }

  async deactivateModule(req, res, next) {
    try {
      const module = await moduleService.deactivateModule(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Module deactivated successfully',
        data: module,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ModuleController();
