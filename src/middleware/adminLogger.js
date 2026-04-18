const AdminLog = require('../models/AdminLog');

const adminLogger = (action, resource = null) => {
  return async (req, res, next) => {
    try {
      // Log the action after response is sent
      res.on('finish', async () => {
        if (req.admin && res.statusCode >= 200 && res.statusCode < 400) {
          try {
            await AdminLog.create({
              adminId: req.admin.id,
              action,
              resource,
              resourceId: req.params.id || null,
              ipAddress: req.ip,
              userAgent: req.get('user-agent'),
            });
          } catch (error) {
            console.error('Error logging admin action:', error);
          }
        }
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = adminLogger;
