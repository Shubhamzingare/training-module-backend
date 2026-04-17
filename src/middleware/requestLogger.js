const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log response when it's sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.request(`${req.method} ${req.path}`, res.statusCode);
    logger.debug(`Duration: ${duration}ms`);
  });

  next();
};

module.exports = requestLogger;
