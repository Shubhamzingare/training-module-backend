const Department = require('../../models/Department');
const { NotFoundError, ValidationError, ConflictError } = require('../../utils/errorTypes');
const logger = require('../../utils/logger');

class DepartmentService {
  async createDepartment(data, adminId) {
    try {
      const { name, description } = data;

      if (!name) {
        throw new ValidationError('Department name is required');
      }

      // Check if department already exists
      const existing = await Department.findOne({ name });
      if (existing) {
        throw new ConflictError('Department already exists');
      }

      const department = new Department({
        name,
        description: description || '',
        createdBy: adminId,
      });

      await department.save();
      await department.populate('createdBy', 'name email');
      logger.success(`Department created: ${name}`);
      return department;
    } catch (error) {
      if (error instanceof (ValidationError || ConflictError)) throw error;
      throw new ValidationError(error.message);
    }
  }

  async getAllDepartments() {
    try {
      const departments = await Department.find().populate('createdBy', 'name email').sort({ createdAt: -1 });
      return departments;
    } catch (error) {
      throw new ValidationError('Failed to fetch departments');
    }
  }

  async getDepartmentById(departmentId) {
    try {
      const department = await Department.findById(departmentId).populate('createdBy', 'name email');
      if (!department) {
        throw new NotFoundError('Department not found');
      }
      return department;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new ValidationError(error.message);
    }
  }

  async updateDepartment(departmentId, data) {
    try {
      const { name, description } = data;

      // Check if new name is unique (if changing name)
      if (name) {
        const existing = await Department.findOne({ name, _id: { $ne: departmentId } });
        if (existing) {
          throw new ConflictError('Department name already exists');
        }
      }

      const department = await Department.findByIdAndUpdate(
        departmentId,
        { name, description },
        { new: true, runValidators: true }
      ).populate('createdBy', 'name email');

      if (!department) {
        throw new NotFoundError('Department not found');
      }

      logger.success(`Department updated: ${name}`);
      return department;
    } catch (error) {
      if (error instanceof (NotFoundError || ConflictError)) throw error;
      throw new ValidationError(error.message);
    }
  }

  async deleteDepartment(departmentId) {
    try {
      const department = await Department.findByIdAndDelete(departmentId);
      if (!department) {
        throw new NotFoundError('Department not found');
      }
      logger.success(`Department deleted: ${department.name}`);
      return department;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new ValidationError(error.message);
    }
  }
}

module.exports = new DepartmentService();
