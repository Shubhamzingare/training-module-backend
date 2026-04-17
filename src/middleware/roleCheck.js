const { ForbiddenError } = require('../utils/errorTypes');
const { ROLES } = require('../config/constants');

const roleCheck = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('User not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access denied. Required role: ${allowedRoles.join(' or ')}`
        )
      );
    }

    next();
  };
};

const adminOnly = roleCheck([ROLES.ADMIN]);
const userOnly = roleCheck([ROLES.USER]);
const anyRole = roleCheck([ROLES.ADMIN, ROLES.USER]);

module.exports = {
  roleCheck,
  adminOnly,
  userOnly,
  anyRole,
};
