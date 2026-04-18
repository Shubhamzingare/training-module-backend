const logger = require('../../utils/logger');
const { ValidationError, NotFoundError, ServerError } = require('../../utils/errorTypes');
const Module = require('../../models/Module');
const FileService = require('../file/fileService');
const ContentGeneratorService = require('./contentGeneratorService');
const path = require('path');

/**
 * Module Service - Manage module CRUD and content generation
 */
class ModuleService {
  /**
   * Create module with file upload
   */
  static async createModuleWithFile(moduleData, file, userId) {
    try {
      logger.info('Creating module with file upload...');

      // Validate required fields
      if (!moduleData.title || !moduleData.type) {
        throw new ValidationError('Title and type are required');
      }

      // Upload file
      const fileInfo = await FileService.uploadFile(file);

      // Create module
      const module = new Module({
        title: moduleData.title,
        description: moduleData.description || '',
        type: moduleData.type,
        podName: moduleData.podName,
        sourceFileUrl: fileInfo.relativePath,
        sourceFileType: fileInfo.type,
        createdBy: userId,
        status: 'draft',
      });

      const savedModule = await module.save();
      logger.success(`Module created: ${savedModule._id}`);

      return {
        success: true,
        module: {
          id: savedModule._id,
          title: savedModule.title,
          type: savedModule.type,
          status: savedModule.status,
          sourceFileUrl: savedModule.sourceFileUrl,
          sourceFileType: savedModule.sourceFileType,
          createdAt: savedModule.createdAt,
        },
        file: {
          filename: fileInfo.filename,
          path: fileInfo.relativePath,
          size: fileInfo.size,
        },
      };
    } catch (error) {
      logger.error('Module creation with file failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate content for module
   */
  static async generateModuleContent(moduleId) {
    try {
      logger.info(`Generating content for module: ${moduleId}`);

      // Get module
      const module = await Module.findById(moduleId);
      if (!module) {
        throw new NotFoundError('Module not found');
      }

      // Get file path
      const filePath = path.join(__dirname, `../../uploads/${module.sourceFileUrl.split('/').pop()}`);

      // Generate and save content
      const result = await ContentGeneratorService.generateAndSaveContent(
        moduleId,
        filePath,
        module.sourceFileType
      );

      return result;
    } catch (error) {
      logger.error('Content generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Update module status
   */
  static async updateModuleStatus(moduleId, status) {
    try {
      const module = await Module.findById(moduleId);
      if (!module) {
        throw new NotFoundError('Module not found');
      }

      module.status = status;
      const updated = await module.save();

      logger.success(`Module status updated: ${status}`);
      return updated;
    } catch (error) {
      logger.error('Failed to update module status:', error.message);
      throw error;
    }
  }

  /**
   * Get module with content
   */
  static async getModuleWithContent(moduleId) {
    try {
      const module = await Module.findById(moduleId).populate('createdBy', 'name email');

      if (!module) {
        throw new NotFoundError('Module not found');
      }

      const content = await ContentGeneratorService.getModuleContent(moduleId).catch(
        () => null
      );

      return {
        module: module.toObject(),
        content: content ? content.toObject() : null,
      };
    } catch (error) {
      logger.error('Failed to get module with content:', error.message);
      throw error;
    }
  }

  /**
   * List modules with pagination
   */
  static async listModules(query = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        status,
        createdBy,
      } = query;

      const filter = {};
      if (type) filter.type = type;
      if (status) filter.status = status;
      if (createdBy) filter.createdBy = createdBy;

      const modules = await Module.find(filter)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Module.countDocuments(filter);

      return {
        data: modules,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Failed to list modules:', error.message);
      throw error;
    }
  }

  /**
   * Get single module
   */
  static async getModule(moduleId) {
    try {
      const module = await Module.findById(moduleId).populate('createdBy', 'name email');

      if (!module) {
        throw new NotFoundError('Module not found');
      }

      return module;
    } catch (error) {
      logger.error('Failed to get module:', error.message);
      throw error;
    }
  }

  /**
   * Update module
   */
  static async updateModule(moduleId, updateData) {
    try {
      const module = await Module.findByIdAndUpdate(
        moduleId,
        {
          title: updateData.title,
          description: updateData.description,
          type: updateData.type,
          podName: updateData.podName,
          status: updateData.status,
          updatedAt: new Date(),
        },
        { new: true, runValidators: true }
      );

      if (!module) {
        throw new NotFoundError('Module not found');
      }

      logger.success(`Module updated: ${moduleId}`);
      return module;
    } catch (error) {
      logger.error('Failed to update module:', error.message);
      throw error;
    }
  }

  /**
   * Delete module and associated files/content
   */
  static async deleteModule(moduleId) {
    try {
      logger.info(`Deleting module: ${moduleId}`);

      const module = await Module.findById(moduleId);
      if (!module) {
        throw new NotFoundError('Module not found');
      }

      // Delete uploaded file
      if (module.sourceFileUrl) {
        try {
          const filePath = path.join(__dirname, `../../uploads/${module.sourceFileUrl.split('/').pop()}`);
          await FileService.deleteFile(filePath);
        } catch (error) {
          logger.warn('Failed to delete uploaded file:', error.message);
        }
      }

      // Delete module content
      try {
        await ContentGeneratorService.deleteModuleContent(moduleId);
      } catch (error) {
        logger.warn('Failed to delete module content:', error.message);
      }

      // Delete module
      await Module.findByIdAndDelete(moduleId);

      logger.success(`Module deleted: ${moduleId}`);
      return true;
    } catch (error) {
      logger.error('Failed to delete module:', error.message);
      throw error;
    }
  }

  /**
   * Get module statistics
   */
  static async getModuleStats() {
    try {
      const stats = await Module.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      const typeStats = await Module.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
          },
        },
      ]);

      return {
        byStatus: stats,
        byType: typeStats,
        total: stats.reduce((sum, s) => sum + s.count, 0),
      };
    } catch (error) {
      logger.error('Failed to get module stats:', error.message);
      throw error;
    }
  }
}

module.exports = ModuleService;
