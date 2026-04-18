const Shift = require('../../models/Shift');
const { NotFoundError, ValidationError, ConflictError } = require('../../utils/errorTypes');
const logger = require('../../utils/logger');

class ShiftService {
  async createShift(data, adminId) {
    try {
      const { name, timeRange } = data;

      if (!name) {
        throw new ValidationError('Shift name is required');
      }

      const existing = await Shift.findOne({ name });
      if (existing) {
        throw new ConflictError('Shift already exists');
      }

      const shift = new Shift({
        name,
        timeRange: timeRange || '',
        createdBy: adminId,
      });

      await shift.save();
      await shift.populate('createdBy', 'name email');
      logger.success(`Shift created: ${name}`);
      return shift;
    } catch (error) {
      if (error instanceof (ValidationError || ConflictError)) throw error;
      throw new ValidationError(error.message);
    }
  }

  async getAllShifts() {
    try {
      const shifts = await Shift.find().populate('createdBy', 'name email').sort({ createdAt: -1 });
      return shifts;
    } catch (error) {
      throw new ValidationError('Failed to fetch shifts');
    }
  }

  async getShiftById(shiftId) {
    try {
      const shift = await Shift.findById(shiftId).populate('createdBy', 'name email');
      if (!shift) {
        throw new NotFoundError('Shift not found');
      }
      return shift;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new ValidationError(error.message);
    }
  }

  async updateShift(shiftId, data) {
    try {
      const { name, timeRange } = data;

      if (name) {
        const existing = await Shift.findOne({ name, _id: { $ne: shiftId } });
        if (existing) {
          throw new ConflictError('Shift name already exists');
        }
      }

      const shift = await Shift.findByIdAndUpdate(
        shiftId,
        { name, timeRange },
        { new: true, runValidators: true }
      ).populate('createdBy', 'name email');

      if (!shift) {
        throw new NotFoundError('Shift not found');
      }

      logger.success(`Shift updated: ${name}`);
      return shift;
    } catch (error) {
      if (error instanceof (NotFoundError || ConflictError)) throw error;
      throw new ValidationError(error.message);
    }
  }

  async deleteShift(shiftId) {
    try {
      const shift = await Shift.findByIdAndDelete(shiftId);
      if (!shift) {
        throw new NotFoundError('Shift not found');
      }
      logger.success(`Shift deleted: ${shift.name}`);
      return shift;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new ValidationError(error.message);
    }
  }
}

module.exports = new ShiftService();
