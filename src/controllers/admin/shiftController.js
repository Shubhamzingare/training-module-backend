const shiftService = require('../../services/admin/shiftService');
const AdminLog = require('../../models/AdminLog');
const { ValidationError } = require('../../utils/errorTypes');

class ShiftController {
  async createShift(req, res, next) {
    try {
      const { name, timeRange } = req.body;

      if (!name) {
        throw new ValidationError('Shift name is required');
      }

      const shift = await shiftService.createShift({ name, timeRange }, req.admin.id);

      await AdminLog.create({
        adminId: req.admin.id,
        action: 'create',
        resource: 'shift',
        resourceId: shift._id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(201).json({
        success: true,
        message: 'Shift created successfully',
        data: shift,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllShifts(req, res, next) {
    try {
      const shifts = await shiftService.getAllShifts();

      res.status(200).json({
        success: true,
        message: 'Shifts retrieved successfully',
        data: shifts,
      });
    } catch (error) {
      next(error);
    }
  }

  async getShiftById(req, res, next) {
    try {
      const { id } = req.params;
      const shift = await shiftService.getShiftById(id);

      res.status(200).json({
        success: true,
        message: 'Shift retrieved successfully',
        data: shift,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateShift(req, res, next) {
    try {
      const { id } = req.params;
      const { name, timeRange } = req.body;

      const shift = await shiftService.updateShift(id, { name, timeRange });

      await AdminLog.create({
        adminId: req.admin.id,
        action: 'update',
        resource: 'shift',
        resourceId: shift._id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(200).json({
        success: true,
        message: 'Shift updated successfully',
        data: shift,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteShift(req, res, next) {
    try {
      const { id } = req.params;
      await shiftService.deleteShift(id);

      await AdminLog.create({
        adminId: req.admin.id,
        action: 'delete',
        resource: 'shift',
        resourceId: id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(200).json({
        success: true,
        message: 'Shift deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ShiftController();
