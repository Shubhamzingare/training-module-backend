const mongoose = require('mongoose');
const logger = require('../utils/logger');
const env = require('./env');

/**
 * MongoDB Database Connection
 */
const connectDB = async () => {
  try {
    logger.info('Connecting to MongoDB...');

    const connection = await mongoose.connect(env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    logger.success('MongoDB connected successfully');
    logger.info(`Database: ${connection.connection.name}`);

    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error.message);
    });

    return connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.success('MongoDB disconnected');
  } catch (error) {
    logger.error('Failed to disconnect from MongoDB:', error.message);
  }
};

/**
 * Check database connection status
 */
const getConnectionStatus = () => {
  return {
    connected: mongoose.connection.readyState === 1,
    state: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  };
};

module.exports = {
  connectDB,
  disconnectDB,
  getConnectionStatus,
};
