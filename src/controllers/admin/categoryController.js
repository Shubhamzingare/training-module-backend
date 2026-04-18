const Category = require('../../models/Category');
const AdminLog = require('../../models/AdminLog');
const { ValidationError, NotFoundError, ConflictError } = require('../../utils/errorTypes');
const logger = require('../../utils/logger');

class CategoryController {
  async createCategory(req, res, next) {
    try {
      const { name, description, icon, type, order } = req.body;

      if (!name) {
        throw new ValidationError('Category name is required');
      }

      // Check if already exists
      const existing = await Category.findOne({ name });
      if (existing) {
        throw new ConflictError('Category already exists');
      }

      const category = new Category({
        name,
        description: description || '',
        icon: icon || '📚',
        type: type || 'wati_training',
        order: order || 0,
        createdBy: req.admin.id,
      });

      await category.save();
      await category.populate('createdBy', 'name email');
      logger.success(`Category created: ${name}`);

      // Log action
      await AdminLog.create({
        adminId: req.admin.id,
        action: 'create',
        resource: 'category',
        resourceId: category._id,
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllCategories(req, res, next) {
    try {
      const categories = await Category.find()
        .populate('createdBy', 'name email')
        .sort({ type: 1, order: 1 });

      res.status(200).json({
        success: true,
        message: 'Categories retrieved successfully',
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryById(req, res, next) {
    try {
      const { id } = req.params;
      const category = await Category.findById(id).populate('createdBy', 'name email');

      if (!category) {
        throw new NotFoundError('Category not found');
      }

      res.status(200).json({
        success: true,
        message: 'Category retrieved successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, icon, type, order } = req.body;

      // Check if name is unique
      if (name) {
        const existing = await Category.findOne({ name, _id: { $ne: id } });
        if (existing) {
          throw new ConflictError('Category name already exists');
        }
      }

      const category = await Category.findByIdAndUpdate(
        id,
        { name, description, icon, type, order },
        { new: true, runValidators: true }
      ).populate('createdBy', 'name email');

      if (!category) {
        throw new NotFoundError('Category not found');
      }

      logger.success(`Category updated: ${name}`);

      // Log action
      await AdminLog.create({
        adminId: req.admin.id,
        action: 'update',
        resource: 'category',
        resourceId: category._id,
        ipAddress: req.ip,
      });

      res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;

      const category = await Category.findByIdAndDelete(id);
      if (!category) {
        throw new NotFoundError('Category not found');
      }

      logger.success(`Category deleted: ${category.name}`);

      // Log action
      await AdminLog.create({
        adminId: req.admin.id,
        action: 'delete',
        resource: 'category',
        resourceId: id,
        ipAddress: req.ip,
      });

      res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CategoryController();
