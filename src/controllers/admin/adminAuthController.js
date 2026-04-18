const adminAuthService = require('../../services/admin/adminAuthService');
const AdminLog = require('../../models/AdminLog');
const { ValidationError } = require('../../utils/errorTypes');

class AdminAuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }

      const result = await adminAuthService.login(email, password);

      // Log the login
      await AdminLog.create({
        adminId: result.admin._id,
        action: 'login',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(200).json({
        success: true,
        message: 'Admin login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      // Log the logout
      if (req.admin) {
        await AdminLog.create({
          adminId: req.admin.id,
          action: 'logout',
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });
      }

      res.status(200).json({
        success: true,
        message: 'Admin logout successful',
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const admin = await adminAuthService.getAdminById(req.admin.id);

      res.status(200).json({
        success: true,
        message: 'Admin profile retrieved',
        data: admin,
      });
    } catch (error) {
      next(error);
    }
  }

  async createAdmin(req, res, next) {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        throw new ValidationError('Name, email, and password are required');
      }

      // Only super_admin can create new admins
      if (req.admin.role !== 'super_admin') {
        throw new ValidationError('Only super admin can create new admins');
      }

      const admin = await adminAuthService.createAdmin(name, email, password, role, req.admin.id);

      // Log the creation
      await AdminLog.create({
        adminId: req.admin.id,
        action: 'create',
        resource: 'admin',
        resourceId: admin._id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(201).json({
        success: true,
        message: 'Admin created successfully',
        data: admin,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminAuthController();
