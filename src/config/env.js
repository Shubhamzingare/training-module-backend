require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,

  // Database
  DB_URI: process.env.DB_URI || 'mongodb://localhost:27017/training-module',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '7d',

  // Claude API
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY || '',
  CLAUDE_MODEL: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',

  // File Upload
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 100 * 1024 * 1024, // 100MB
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  ALLOWED_FILE_TYPES: (process.env.ALLOWED_FILE_TYPES || 'pdf,ppt,pptx,doc,docx,mp4,mov,avi,mkv,webm').split(','),
  MAX_VIDEO_DURATION: process.env.MAX_VIDEO_DURATION || 60 * 60, // 60 minutes in seconds

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
};

module.exports = env;
