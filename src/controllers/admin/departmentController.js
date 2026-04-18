const departmentService = require('../../services/admin/departmentService');
const AdminLog = require('../../models/AdminLog');
const { ValidationError } = require('../../utils/errorTypes');

class DepartmentController {
  async createDepartment(req, res, next) {
    try {
      const { name, description } = req.body;

      if (!name) {
        throw new ValidationError('Department name is required');
      }

      const department = await departmentService.createDepartment({ name, description }, req.admin.id);

      // Log the action
      await AdminLog.create({
        adminId: req.admin.id,
        action: 'create',
        resource: 'department',
        resourceId: department._id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(201).json({
        success: true,
        message: 'Department created successfully',
        data: department,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllDepartments(req, res, next) {
    try {
      const departments = await departmentService.getAllDepartments();

      res.status(200).json({
        success: true,
        message: 'Departments retrieved successfully',
        data: departments,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDepartmentById(req, res, next) {
    try {
      const { id } = req.params;
      const department = await departmentService.getDepartmentById(id);

      res.status(200).json({
        success: true,
        message: 'Department retrieved successfully',
        data: department,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateDepartment(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const department = await departmentService.updateDepartment(id, { name, description });

      // Log the action
      await AdminLog.create({
        adminId: req.admin.id,
        action: 'update',
        resource: 'department',
        resourceId: department._id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(200).json({
        success: true,
        message: 'Department updated successfully',
        data: department,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteDepartment(req, res, next) {
    try {
      const { id } = req.params;
      await departmentService.deleteDepartment(id);

      // Log the action
      await AdminLog.create({
        adminId: req.admin.id,
        action: 'delete',
        resource: 'department',
        resourceId: id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(200).json({
        success: true,
        message: 'Department deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DepartmentController();
