const fs = require('fs').promises;
const path = require('path');
const logger = require('../../utils/logger');
const { ValidationError, ServerError } = require('../../utils/errorTypes');
const env = require('../../config/env');

const ALLOWED_TYPES = env.ALLOWED_FILE_TYPES;
const MAX_SIZE = env.MAX_FILE_SIZE;
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

/**
 * File Service - Handles file upload, validation, and management
 */
class FileService {
  /**
   * Ensure uploads directory exists
   */
  static async ensureUploadsDir() {
    try {
      await fs.mkdir(UPLOADS_DIR, { recursive: true });
    } catch (error) {
      logger.error('Failed to create uploads directory:', error);
      throw new ServerError('Failed to initialize file storage');
    }
  }

  /**
   * Validate file before upload
   */
  static validateFile(file) {
    if (!file) {
      throw new ValidationError('No file provided');
    }

    const fileExtension = path.extname(file.originalname).slice(1).toLowerCase();

    // Check file size
    if (file.size > MAX_SIZE) {
      throw new ValidationError(
        `File size exceeds maximum limit of ${MAX_SIZE / (1024 * 1024)}MB`
      );
    }

    // Check file type
    if (!ALLOWED_TYPES.includes(fileExtension)) {
      throw new ValidationError(
        `File type not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}`
      );
    }

    return fileExtension;
  }

  /**
   * Sanitize filename to make it safe
   */
  static sanitizeFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 200);
  }

  /**
   * Save uploaded file
   */
  static async uploadFile(file) {
    try {
      // Validate file
      const fileExtension = this.validateFile(file);

      // Ensure uploads directory exists
      await this.ensureUploadsDir();

      // Create safe filename with timestamp
      const sanitizedName = this.sanitizeFilename(
        path.parse(file.originalname).name
      );
      const filename = `${Date.now()}-${sanitizedName}.${fileExtension}`;
      const filePath = path.join(UPLOADS_DIR, filename);

      // Save file
      await fs.writeFile(filePath, file.buffer);

      logger.success(`File uploaded successfully: ${filename}`);

      return {
        filename,
        originalName: file.originalname,
        size: file.size,
        path: filePath,
        relativePath: `/uploads/${filename}`,
        mimetype: file.mimetype,
        type: fileExtension,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error('File upload failed:', error);
      throw new ServerError('Failed to upload file');
    }
  }

  /**
   * Get file information
   */
  static async getFileInfo(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const filename = path.basename(filePath);
      const fileExtension = path.extname(filename).slice(1).toLowerCase();

      return {
        filename,
        size: stats.size,
        path: filePath,
        mimetype: this.getMimeType(fileExtension),
        type: fileExtension,
        exists: true,
      };
    } catch (error) {
      logger.warn(`File not found: ${filePath}`);
      return { exists: false, path: filePath };
    }
  }

  /**
   * Get MIME type from file extension
   */
  static getMimeType(extension) {
    const mimeTypes = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    };
    return mimeTypes[extension] || 'application/octet-stream';
  }

  /**
   * Delete uploaded file
   */
  static async deleteFile(filePath) {
    try {
      const fileInfo = await this.getFileInfo(filePath);
      if (!fileInfo.exists) {
        logger.warn(`File does not exist: ${filePath}`);
        return false;
      }

      await fs.unlink(filePath);
      logger.success(`File deleted: ${filePath}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete file ${filePath}:`, error);
      throw new ServerError('Failed to delete file');
    }
  }

  /**
   * Read file content as buffer
   */
  static async readFile(filePath) {
    try {
      const buffer = await fs.readFile(filePath);
      return buffer;
    } catch (error) {
      logger.error(`Failed to read file ${filePath}:`, error);
      throw new ServerError('Failed to read file');
    }
  }
}

module.exports = FileService;
