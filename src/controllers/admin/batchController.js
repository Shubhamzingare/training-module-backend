const batchService = require('../../services/batch/batchService');
const { ValidationError } = require('../../utils/errorTypes');

class BatchController {
  async createBatch(req, res, next) {
    try {
      const { name, description, type } = req.body;

      if (!name || !type) {
        throw new ValidationError('Batch name and type are required');
      }

      const batch = await batchService.createBatch(
        {
          name,
          description,
          type,
        },
        req.user.id
      );

      res.status(201).json({
        success: true,
        message: 'Batch created successfully',
        data: batch,
      });
    } catch (error) {
      next(error);
    }
  }

  async listBatches(req, res, next) {
    try {
      const { type, limit = 10, skip = 0, sort = '-createdAt' } = req.query;

      const result = await batchService.listBatches(
        { type },
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

  async getBatch(req, res, next) {
    try {
      const batch = await batchService.getBatchById(req.params.id);

      res.status(200).json({
        success: true,
        data: batch,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBatch(req, res, next) {
    try {
      const batch = await batchService.updateBatch(req.params.id, req.body);

      res.status(200).json({
        success: true,
        message: 'Batch updated successfully',
        data: batch,
      });
    } catch (error) {
      next(error);
    }
  }

  async assignModulesToBatch(req, res, next) {
    try {
      const { moduleIds } = req.body;

      if (!moduleIds || !Array.isArray(moduleIds)) {
        throw new ValidationError('moduleIds array is required');
      }

      const result = await batchService.assignModulesToBatch(
        req.params.id,
        moduleIds
      );

      res.status(200).json({
        success: true,
        message: 'Modules assigned to batch successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async addMembers(req, res, next) {
    try {
      const { userIds } = req.body;

      if (!userIds || !Array.isArray(userIds)) {
        throw new ValidationError('userIds array is required');
      }

      const result = await batchService.addMembersToBatch(
        req.params.id,
        userIds
      );

      res.status(200).json({
        success: true,
        message: 'Members added to batch successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBatchMembers(req, res, next) {
    try {
      const { limit = 10, skip = 0 } = req.query;

      const result = await batchService.getBatchMembers(req.params.id, {
        limit: parseInt(limit),
        skip: parseInt(skip),
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteBatch(req, res, next) {
    try {
      const batch = await batchService.deleteBatch(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Batch deleted successfully',
        data: batch,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BatchController();
