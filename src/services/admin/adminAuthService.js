const jwt = require('jsonwebtoken');
const Admin = require('../../models/Admin');
const env = require('../../config/env');
const {
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
} = require('../../utils/errorTypes');
const logger = require('../../utils/logger');

class AdminAuthService {
  async login(email, password) {
    try {
      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }

      // Find admin by email
      const admin = await Admin.findOne({ email }).select('+password');
      if (!admin) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Check if admin is active
      if (!admin.isActive) {
        throw new UnauthorizedError('Admin account is inactive');
      }

      // Compare password
      const isPasswordValid = await admin.comparePassword(password);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Generate token
      const token = this.generateToken(admin._id, admin.email, admin.role);
      logger.success(`Admin logged in: ${email}`);

      return {
        admin: admin.toJSON(),
        token,
      };
    } catch (error) {
      // Re-throw known errors
      if (error instanceof UnauthorizedError || error instanceof ValidationError) {
        throw error;
      }
      // Log and throw the real error for debugging
      logger.error('Login error:', error.message);
      throw new ValidationError('Login failed: ' + error.message);
    }
  }

  async createAdmin(name, email, password, role, createdByAdminId) {
    try {
      if (!name || !email || !password) {
        throw new ValidationError('Name, email, and password are required');
      }

      // Check if email already exists
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        throw new ConflictError('Email already registered');
      }

      // Create new admin
      const admin = new Admin({
        name,
        email,
        password,
        role: role || 'admin',
        createdBy: createdByAdminId,
      });

      await admin.save();
      logger.success(`New admin created: ${email}`);

      return admin.toJSON();
    } catch (error) {
      if (error instanceof (ConflictError || ValidationError)) {
        throw error;
      }
      throw new ValidationError(error.message || 'Admin creation failed');
    }
  }

  async getAdminById(adminId) {
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new NotFoundError('Admin not found');
    }
    return admin.toJSON();
  }

  generateToken(adminId, email, role) {
    const secret = env.JWT_SECRET || 'habuild-training-secret-2024';
    const expiry = env.JWT_EXPIRY || '7d';
    return jwt.sign(
      { id: adminId, email, role },
      secret,
      { expiresIn: expiry.trim() }
    );
  }
}

module.exports = new AdminAuthService();
