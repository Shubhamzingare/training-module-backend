const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errorTypes');
const env = require('../config/env');

const ALLOWED_TYPES = env.ALLOWED_FILE_TYPES;
const MAX_SIZE = env.MAX_FILE_SIZE;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Configure storage for multer
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Create a unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

/**
 * File type mapping for validation
 */
const fileTypeMap = {
  pdf: {
    extensions: ['pdf'],
    mimeTypes: ['application/pdf'],
  },
  pptx: {
    extensions: ['pptx', 'ppt'],
    mimeTypes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-powerpoint'],
  },
  video: {
    extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
    mimeTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'],
  },
  doc: {
    extensions: ['doc', 'docx'],
    mimeTypes: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
};

/**
 * File filter for multer
 */
const fileFilter = (req, file, cb) => {
  try {
    // If file is provided, validate it
    if (file) {
      // Extract file extension
      const fileExtension = path.extname(file.originalname).slice(1).toLowerCase();

      // Check if file type is allowed globally
      if (!ALLOWED_TYPES.includes(fileExtension)) {
        logger.warn(
          `File upload rejected: Invalid type ${fileExtension} for ${file.originalname}`
        );
        return cb(
          new ValidationError(
            `File type not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}`
          )
        );
      }

      // If fileType is specified in request, validate against that type
      const selectedFileType = req.body?.fileType;
      if (selectedFileType && fileTypeMap[selectedFileType]) {
        const allowedExtensions = fileTypeMap[selectedFileType].extensions;
        if (!allowedExtensions.includes(fileExtension)) {
          logger.warn(
            `File upload rejected: ${fileExtension} not allowed for type ${selectedFileType}`
          );
          return cb(
            new ValidationError(
              `Invalid file type for ${selectedFileType}. Allowed: ${allowedExtensions.map(e => '.' + e).join(', ')}`
            )
          );
        }
      }

      // Validate MIME type
      const mimeTypePrefix = file.mimetype.split('/')[0];
      if (
        mimeTypePrefix !== 'application' &&
        mimeTypePrefix !== 'text' &&
        mimeTypePrefix !== 'video'
      ) {
        logger.warn(
          `File upload rejected: Invalid MIME type ${file.mimetype}`
        );
        return cb(new ValidationError('Invalid file MIME type'));
      }

      cb(null, true);
    } else {
      // No file provided - that's okay for optional uploads
      cb(null, true);
    }
  } catch (error) {
    logger.error('File filter error:', error);
    cb(error);
  }
};

/**
 * Create multer instance
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE,
  },
});

/**
 * Middleware for single file upload
 */
const uploadSingleFile = upload.single('file');

/**
 * Middleware to handle file upload with error handling
 */
const handleFileUpload = (req, res, next) => {
  uploadSingleFile(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      logger.error('Multer error:', err.message);

      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          error: {
            message: `File size exceeds maximum limit of ${MAX_SIZE / (1024 * 1024)}MB`,
            statusCode: 413,
          },
        });
      }

      if (err.code === 'LIMIT_PART_COUNT') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Too many form fields',
            statusCode: 400,
          },
        });
      }

      return res.status(400).json({
        success: false,
        error: {
          message: err.message,
          statusCode: 400,
        },
      });
    }

    if (err) {
      logger.error('File upload error:', err.message);

      if (err instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: {
            message: err.message,
            statusCode: 400,
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          message: 'File upload failed',
          statusCode: 500,
        },
      });
    }

    // File is optional, so if provided, log it
    if (req.file) {
      logger.info(`File received: ${req.file.originalname} (${req.file.size} bytes)`);
    }

    next();
  });
};

module.exports = {
  upload,
  uploadSingleFile,
  handleFileUpload,
};
