const app = require('./src/app');
const env = require('./src/config/env');
const logger = require('./src/utils/logger');

const startServer = async () => {
  try {
    // TODO: Connect to MongoDB
    // await connectDB();
    // logger.success('Database connected');

    const PORT = env.PORT;
    app.listen(PORT, () => {
      logger.success(`Training Module API running on port ${PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
