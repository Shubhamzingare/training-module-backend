const Module = require('../../models/Module');
const AdminLog = require('../../models/AdminLog');
const { ValidationError, NotFoundError, ConflictError } = require('../../utils/errorTypes');
const logger = require('../../utils/logger');

class ModuleAdminController {
  async createModule(req, res, next) {
    try {
      const { title, description, categoryId, topicId, fileType, fileUrl } = req.body;

      if (!title) {
        throw new ValidationError('Module title is required');
      }

      if (!categoryId) {
        throw new ValidationError('Category ID is required');
      }

      const module = new Module({
        title,
        description: description || '',
        categoryId,
        topicId: topicId || null,
        fileUrl: fileUrl || '',
        fileType: fileType || 'pdf',
        status: 'draft',
        keyPoints: [],
        faqs: [],
        createdBy: req.admin.id,
      });

      await module.save();
      await module.populate('categoryId', 'name');
      await module.populate('topicId', 'name');
      await module.populate('createdBy', 'name email');
      logger.success(`Module created: ${title}`);

      // Log action
      await AdminLog.create({
        adminId: req.admin.id,
        action: 'create',
        resource: 'module',
        resourceId: module._id,
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        message: 'Module created successfully',
        data: module,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllModules(req, res, next) {
    try {
      const { categoryId, topicId, status } = req.query;
      const filter = {};

      if (categoryId) {
        filter.categoryId = categoryId;
      }

      if (topicId) {
        filter.topicId = topicId;
      }

      if (status) {
        filter.status = status;
      }

      const modules = await Module.find(filter)
        .populate('categoryId', 'name')
        .populate('topicId', 'name')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        message: 'Modules retrieved successfully',
        data: modules,
      });
    } catch (error) {
      next(error);
    }
  }

  async getModuleById(req, res, next) {
    try {
      const { id } = req.params;
      const module = await Module.findById(id)
        .populate('categoryId', 'name')
        .populate('topicId', 'name')
        .populate('createdBy', 'name email');

      if (!module) {
        throw new NotFoundError('Module not found');
      }

      res.status(200).json({
        success: true,
        message: 'Module retrieved successfully',
        data: module,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateModule(req, res, next) {
    try {
      const { id } = req.params;
      const { title, description, categoryId, topicId, fileType, fileUrl, status } = req.body;

      const module = await Module.findByIdAndUpdate(
        id,
        {
          title,
          description,
          categoryId,
          topicId,
          fileType,
          fileUrl,
          status,
        },
        { new: true, runValidators: true }
      )
        .populate('categoryId', 'name')
        .populate('topicId', 'name')
        .populate('createdBy', 'name email');

      if (!module) {
        throw new NotFoundError('Module not found');
      }

      logger.success(`Module updated: ${title}`);

      // Log action
      await AdminLog.create({
        adminId: req.admin.id,
        action: 'update',
        resource: 'module',
        resourceId: module._id,
        ipAddress: req.ip,
      });

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
      const { id } = req.params;

      const module = await Module.findByIdAndDelete(id);
      if (!module) {
        throw new NotFoundError('Module not found');
      }

      logger.success(`Module deleted: ${module.title}`);

      // Log action
      await AdminLog.create({
        adminId: req.admin.id,
        action: 'delete',
        resource: 'module',
        resourceId: id,
        ipAddress: req.ip,
      });

      res.status(200).json({
        success: true,
        message: 'Module deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ModuleAdminController();
