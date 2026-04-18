const Topic = require('../../models/Topic');
const AdminLog = require('../../models/AdminLog');
const { ValidationError, NotFoundError, ConflictError } = require('../../utils/errorTypes');
const logger = require('../../utils/logger');

class TopicController {
  async createTopic(req, res, next) {
    try {
      const { name, description, categoryId, order } = req.body;

      if (!name) {
        throw new ValidationError('Topic name is required');
      }

      if (!categoryId) {
        throw new ValidationError('Category ID is required');
      }

      // Check if topic already exists in this category
      const existing = await Topic.findOne({ name, categoryId });
      if (existing) {
        throw new ConflictError('Topic with this name already exists in this category');
      }

      const topic = new Topic({
        name,
        description: description || '',
        categoryId,
        order: order || 0,
        createdBy: req.admin.id,
      });

      await topic.save();
      await topic.populate('categoryId', 'name');
      await topic.populate('createdBy', 'name email');
      logger.success(`Topic created: ${name}`);

      // Log action
      await AdminLog.create({
        adminId: req.admin.id,
        action: 'create',
        resource: 'topic',
        resourceId: topic._id,
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        message: 'Topic created successfully',
        data: topic,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllTopics(req, res, next) {
    try {
      const { categoryId } = req.query;
      const filter = {};

      if (categoryId) {
        filter.categoryId = categoryId;
      }

      const topics = await Topic.find(filter)
        .populate('categoryId', 'name')
        .populate('createdBy', 'name email')
        .sort({ categoryId: 1, order: 1 });

      res.status(200).json({
        success: true,
        message: 'Topics retrieved successfully',
        data: topics,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTopicById(req, res, next) {
    try {
      const { id } = req.params;
      const topic = await Topic.findById(id)
        .populate('categoryId', 'name')
        .populate('createdBy', 'name email');

      if (!topic) {
        throw new NotFoundError('Topic not found');
      }

      res.status(200).json({
        success: true,
        message: 'Topic retrieved successfully',
        data: topic,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTopic(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, order } = req.body;

      // Check if name is unique within the category
      if (name) {
        const topic = await Topic.findById(id);
        if (!topic) {
          throw new NotFoundError('Topic not found');
        }

        const existing = await Topic.findOne({
          name,
          categoryId: topic.categoryId,
          _id: { $ne: id },
        });
        if (existing) {
          throw new ConflictError('Topic name already exists in this category');
        }
      }

      const topic = await Topic.findByIdAndUpdate(
        id,
        { name, description, order },
        { new: true, runValidators: true }
      )
        .populate('categoryId', 'name')
        .populate('createdBy', 'name email');

      if (!topic) {
        throw new NotFoundError('Topic not found');
      }

      logger.success(`Topic updated: ${name}`);

      // Log action
      await AdminLog.create({
        adminId: req.admin.id,
        action: 'update',
        resource: 'topic',
        resourceId: topic._id,
        ipAddress: req.ip,
      });

      res.status(200).json({
        success: true,
        message: 'Topic updated successfully',
        data: topic,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteTopic(req, res, next) {
    try {
      const { id } = req.params;

      const topic = await Topic.findByIdAndDelete(id);
      if (!topic) {
        throw new NotFoundError('Topic not found');
      }

      logger.success(`Topic deleted: ${topic.name}`);

      // Log action
      await AdminLog.create({
        adminId: req.admin.id,
        action: 'delete',
        resource: 'topic',
        resourceId: id,
        ipAddress: req.ip,
      });

      res.status(200).json({
        success: true,
        message: 'Topic deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TopicController();
