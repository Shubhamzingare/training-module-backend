const { exec } = require('child_process');
const { promisify } = require('util');
const logger = require('../../utils/logger');
const { ValidationError, ServerError } = require('../../utils/errorTypes');
const env = require('../../config/env');

const execAsync = promisify(exec);
const MAX_VIDEO_DURATION = env.MAX_VIDEO_DURATION;

/**
 * Video Validation Service - Check video duration and metadata
 */
class VideoValidationService {
  /**
   * Check if ffprobe is available
   */
  static async isFfprobeAvailable() {
    try {
      await execAsync('ffprobe -version');
      return true;
    } catch (error) {
      logger.warn('ffprobe not available on system');
      return false;
    }
  }

  /**
   * Get video duration using ffprobe
   */
  static async getVideoDurationWithFfprobe(filePath) {
    try {
      const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1:nokey=1 "${filePath}"`;
      const { stdout } = await execAsync(command);
      const duration = parseFloat(stdout.trim());

      if (isNaN(duration)) {
        throw new Error('Could not parse video duration');
      }

      return Math.round(duration);
    } catch (error) {
      logger.error('ffprobe duration extraction failed:', error.message);
      throw new ServerError('Failed to validate video duration');
    }
  }

  /**
   * Validate video duration
   */
  static async validateVideoDuration(filePath, fileType) {
    try {
      // Only validate if it's a video file
      if (!['mp4', 'mov', 'avi', 'mkv', 'webm', 'video'].includes(fileType.toLowerCase())) {
        return { valid: true, duration: 0 };
      }

      // Check if ffprobe is available
      const ffprobeAvailable = await this.isFfprobeAvailable();

      if (!ffprobeAvailable) {
        logger.info('ffprobe not available - skipping server-side video duration check');
        return { valid: true, duration: 0, warning: 'Video duration check skipped (ffprobe not available)' };
      }

      // Get video duration
      const duration = await this.getVideoDurationWithFfprobe(filePath);

      // Check if duration exceeds limit
      if (duration > MAX_VIDEO_DURATION) {
        const maxDurationFormatted = this.formatDuration(MAX_VIDEO_DURATION);
        const actualDurationFormatted = this.formatDuration(duration);
        return {
          valid: false,
          duration,
          error: `Video duration (${actualDurationFormatted}) exceeds allowed limit (${maxDurationFormatted})`,
        };
      }

      return {
        valid: true,
        duration,
        message: `Video duration validated: ${this.formatDuration(duration)}`,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      // Log the error but don't fail the upload if validation fails
      logger.warn('Video duration validation error:', error.message);
      return { valid: true, duration: 0, warning: 'Could not validate video duration' };
    }
  }

  /**
   * Format seconds to readable duration
   */
  static formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.round(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  }
}

module.exports = VideoValidationService;
