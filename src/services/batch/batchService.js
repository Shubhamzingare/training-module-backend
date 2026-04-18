const Batch = require('../../models/Batch');
const BatchMember = require('../../models/BatchMember');
const User = require('../../models/User');
const {
  NotFoundError,
  ValidationError,
  ServerError,
  ConflictError,
} = require('../../utils/errorTypes');
const logger = require('../../utils/logger');

class BatchService {
  async createBatch(data, createdBy) {
    try {
      const { name, description, type } = data;

      if (!name || !type) {
        throw new ValidationError('Batch name and type are required');
      }

      const batch = new Batch({
        name,
        description,
        type,
        createdBy,
      });

      await batch.save();
      logger.success(`Batch created: ${batch._id}`);
      return batch;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ServerError(`Failed to create batch: ${error.message}`);
    }
  }

  async listBatches(filters = {}, pagination = {}) {
    try {
      const { type } = filters;
      const { limit = 10, skip = 0, sort = '-createdAt' } = pagination;

      const query = {};
      if (type) query.type = type;

      const batches = await Batch.find(query)
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .populate('createdBy', 'name email');

      const total = await Batch.countDocuments(query);

      // Get member count for each batch
      const batchesWithCount = await Promise.all(
        batches.map(async (batch) => {
          const memberCount = await BatchMember.countDocuments({
            batchId: batch._id,
          });
          return {
            ...batch.toObject(),
            memberCount,
          };
        })
      );

      return {
        data: batchesWithCount,
        pagination: {
          total,
          limit,
          skip,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new ServerError(`Failed to list batches: ${error.message}`);
    }
  }

  async getBatchById(batchId) {
    try {
      const batch = await Batch.findById(batchId).populate(
        'createdBy',
        'name email'
      );

      if (!batch) {
        throw new NotFoundError('Batch not found');
      }

      const memberCount = await BatchMember.countDocuments({ batchId });

      return {
        ...batch.toObject(),
        memberCount,
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new ServerError(`Failed to fetch batch: ${error.message}`);
    }
  }

  async updateBatch(batchId, data) {
    try {
      const allowedFields = ['name', 'description', 'type'];
      const updates = {};

      allowedFields.forEach((field) => {
        if (data[field] !== undefined) {
          updates[field] = data[field];
        }
      });

      const batch = await Batch.findByIdAndUpdate(
        batchId,
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!batch) {
        throw new NotFoundError('Batch not found');
      }

      logger.success(`Batch updated: ${batchId}`);
      return batch;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new ServerError(`Failed to update batch: ${error.message}`);
    }
  }

  async assignModulesToBatch(batchId, moduleIds) {
    try {
      const batch = await Batch.findById(batchId);
      if (!batch) {
        throw new NotFoundError('Batch not found');
      }

      // Get all members of this batch
      const batchMembers = await BatchMember.find({ batchId });
      const userIds = [...new Set(batchMembers.map((m) => m.userId))];

      // Create BatchMember entries for each user-module combination
      const assignments = [];
      for (const userId of userIds) {
        for (const moduleId of moduleIds) {
          // Check if already assigned
          const exists = await BatchMember.findOne({
            batchId,
            userId,
            moduleId,
          });

          if (!exists) {
            assignments.push({
              batchId,
              userId,
              moduleId,
            });
          }
        }
      }

      if (assignments.length > 0) {
        await BatchMember.insertMany(assignments);
        logger.success(
          `Modules assigned to batch ${batchId}: ${assignments.length} assignments`
        );
      }

      return {
        batchId,
        modulesAssigned: moduleIds.length,
        totalAssignments: assignments.length,
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new ServerError(
        `Failed to assign modules to batch: ${error.message}`
      );
    }
  }

  async addMembersToBatch(batchId, userIds) {
    try {
      const batch = await Batch.findById(batchId);
      if (!batch) {
        throw new NotFoundError('Batch not found');
      }

      // Verify all users exist
      const users = await User.find({ _id: { $in: userIds } });
      if (users.length !== userIds.length) {
        throw new ValidationError('One or more users not found');
      }

      // Create BatchMember entries
      const members = [];
      for (const userId of userIds) {
        const exists = await BatchMember.findOne({ batchId, userId });
        if (!exists) {
          members.push({
            batchId,
            userId,
          });
        }
      }

      let addedCount = 0;
      if (members.length > 0) {
        await BatchMember.insertMany(members);
        addedCount = members.length;
        logger.success(
          `Users added to batch ${batchId}: ${addedCount} members`
        );
      }

      return {
        batchId,
        usersRequested: userIds.length,
        membersAdded: addedCount,
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError)
        throw error;
      throw new ServerError(`Failed to add members to batch: ${error.message}`);
    }
  }

  async getBatchMembers(batchId, pagination = {}) {
    try {
      const { limit = 10, skip = 0 } = pagination;

      const batch = await Batch.findById(batchId);
      if (!batch) {
        throw new NotFoundError('Batch not found');
      }

      const members = await BatchMember.find({ batchId })
        .limit(limit)
        .skip(skip)
        .populate('userId', 'name email department')
        .populate('moduleId', 'title');

      const total = await BatchMember.countDocuments({ batchId });

      return {
        data: members,
        pagination: {
          total,
          limit,
          skip,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new ServerError(
        `Failed to fetch batch members: ${error.message}`
      );
    }
  }

  async deleteBatch(batchId) {
    try {
      const batch = await Batch.findByIdAndDelete(batchId);
      if (!batch) {
        throw new NotFoundError('Batch not found');
      }

      // Also delete all batch members
      await BatchMember.deleteMany({ batchId });

      logger.success(`Batch deleted: ${batchId}`);
      return batch;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new ServerError(`Failed to delete batch: ${error.message}`);
    }
  }
}

module.exports = new BatchService();
