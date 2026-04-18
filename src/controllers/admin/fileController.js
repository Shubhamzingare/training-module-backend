const logger = require('../../utils/logger');
const ModuleService = require('../../services/module/moduleService');
const ContentGeneratorService = require('../../services/module/contentGeneratorService');
const { ValidationError } = require('../../utils/errorTypes');

/**
 * File Controller - Handle file uploads and content generation
 */
class FileController {
  /**
   * Create module with file upload and auto-generate content
   * POST /api/admin/modules
   */
  static async createModuleWithFile(req, res, next) {
    try {
      logger.info('File upload and module creation request received');

      const { title, description, type, podName } = req.body;
      const file = req.file;
      const userId = req.user.id;

      // Validate required fields
      if (!title || !type || !file) {
        throw new ValidationError('Title, type, and file are required');
      }

      // Create module with file
      const moduleResult = await ModuleService.createModuleWithFile(
        {
          title,
          description,
          type,
          podName,
        },
        file,
        userId
      );

      logger.info('Triggering content generation...');

      // Generate content (async, don't wait)
      ModuleService.generateModuleContent(moduleResult.module.id)
        .then((contentResult) => {
          logger.success('Content generation completed successfully');
        })
        .catch((error) => {
          logger.error(
            'Content generation failed (continuing anyway):',
            error.message
          );
        });

      res.status(201).json({
        success: true,
        message: 'Module created successfully. Content generation started.',
        data: {
          ...moduleResult,
          contentGenerationStatus: 'in_progress',
        },
      });
    } catch (error) {
      logger.error('File upload failed:', error.message);
      next(error);
    }
  }

  /**
   * Trigger content generation for existing module
   * POST /api/admin/modules/:moduleId/generate-content
   */
  static async generateModuleContent(req, res, next) {
    try {
      const { moduleId } = req.params;

      logger.info(`Generating content for module: ${moduleId}`);

      const result = await ModuleService.generateModuleContent(moduleId);

      res.json({
        success: true,
        message: 'Content generation completed',
        data: result,
      });
    } catch (error) {
      logger.error('Content generation failed:', error.message);
      next(error);
    }
  }

  /**
   * Get module with generated content
   * GET /api/admin/modules/:moduleId
   */
  static async getModuleWithContent(req, res, next) {
    try {
      const { moduleId } = req.params;

      const result = await ModuleService.getModuleWithContent(moduleId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Failed to get module:', error.message);
      next(error);
    }
  }

  /**
   * List all modules
   * GET /api/admin/modules
   */
  static async listModules(req, res, next) {
    try {
      const result = await ModuleService.listModules(req.query);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('Failed to list modules:', error.message);
      next(error);
    }
  }

  /**
   * Update module
   * PUT /api/admin/modules/:moduleId
   */
  static async updateModule(req, res, next) {
    try {
      const { moduleId } = req.params;
      const updateData = req.body;

      const module = await ModuleService.updateModule(moduleId, updateData);

      res.json({
        success: true,
        message: 'Module updated successfully',
        data: module,
      });
    } catch (error) {
      logger.error('Failed to update module:', error.message);
      next(error);
    }
  }

  /**
   * Delete module
   * DELETE /api/admin/modules/:moduleId
   */
  static async deleteModule(req, res, next) {
    try {
      const { moduleId } = req.params;

      await ModuleService.deleteModule(moduleId);

      res.json({
        success: true,
        message: 'Module deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete module:', error.message);
      next(error);
    }
  }

  /**
   * Update module content manually
   * PUT /api/admin/modules/:moduleId/content
   */
  static async updateModuleContent(req, res, next) {
    try {
      const { moduleId } = req.params;
      const { keyPoints, faqs } = req.body;

      const content = await ContentGeneratorService.updateModuleContent(
        moduleId,
        { keyPoints, faqs }
      );

      res.json({
        success: true,
        message: 'Module content updated successfully',
        data: content,
      });
    } catch (error) {
      logger.error('Failed to update content:', error.message);
      next(error);
    }
  }

  /**
   * Get module statistics
   * GET /api/admin/modules/stats
   */
  static async getModuleStats(req, res, next) {
    try {
      const stats = await ModuleService.getModuleStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Failed to get stats:', error.message);
      next(error);
    }
  }
}

module.exports = FileController;
