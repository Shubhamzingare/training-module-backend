const env = require('../config/env');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

const logger = {
  info: (message, data = '') => {
    console.log(`${colors.blue}[INFO]${colors.reset} ${message}`, data);
  },

  success: (message, data = '') => {
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`, data);
  },

  warn: (message, data = '') => {
    console.log(`${colors.yellow}[WARN]${colors.reset} ${message}`, data);
  },

  error: (message, error = '') => {
    console.error(`${colors.red}[ERROR]${colors.reset} ${message}`, error);
  },

  debug: (message, data = '') => {
    if (env.NODE_ENV === 'development') {
      console.log(`${colors.gray}[DEBUG]${colors.reset} ${message}`, data);
    }
  },

  request: (method, path, statusCode) => {
    const statusColor =
      statusCode >= 400 ? colors.red : statusCode >= 300 ? colors.yellow : colors.green;
    console.log(
      `${statusColor}${method} ${path} → ${statusCode}${colors.reset}`
    );
  },
};

module.exports = logger;
