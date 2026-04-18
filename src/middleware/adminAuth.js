const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { UnauthorizedError } = require('../utils/errorTypes');
const logger = require('../utils/logger');

const adminAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Check if it's an admin token
    if (!decoded.role || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
      throw new UnauthorizedError('Admin access required');
    }

    req.admin = decoded;
    logger.debug(`Admin authenticated: ${decoded.id}`);
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return next(error);
    }
    next(new UnauthorizedError('Invalid or expired token'));
  }
};

module.exports = adminAuth;
