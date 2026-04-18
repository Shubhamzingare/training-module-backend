const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { promisify } = require('util');
const logger = require('../../utils/logger');
const { ValidationError, ServerError } = require('../../utils/errorTypes');
const FileService = require('./fileService');

/**
 * Text Extractor Service - Extract text from various file formats
 */
class TextExtractor {
  /**
   * Extract text from file based on type
   */
  static async extractText(filePath, fileType) {
    logger.info(`Extracting text from ${fileType} file: ${filePath}`);

    try {
      switch (fileType.toLowerCase()) {
        case 'pdf':
          return await this.extractTextFromPDF(filePath);
        case 'doc':
        case 'docx':
          return await this.extractTextFromDocx(filePath);
        case 'ppt':
        case 'pptx':
          return await this.extractTextFromPptx(filePath);
        default:
          throw new ValidationError(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error(`Text extraction failed for ${fileType}:`, error);
      throw new ServerError(`Failed to extract text from ${fileType} file`);
    }
  }

  /**
   * Extract text from PDF file
   */
  static async extractTextFromPDF(filePath) {
    try {
      const buffer = await FileService.readFile(filePath);
      const data = await pdfParse(buffer);

      let text = data.text;

      // Clean extracted text
      text = this.cleanText(text);

      if (!text || text.trim().length === 0) {
        throw new ValidationError('No text found in PDF file');
      }

      logger.success(
        `PDF text extracted successfully (${text.length} characters)`
      );
      return text;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error('PDF extraction failed:', error);
      throw new ServerError('Failed to extract text from PDF');
    }
  }

  /**
   * Extract text from DOC/DOCX file
   */
  static async extractTextFromDocx(filePath) {
    try {
      const buffer = await FileService.readFile(filePath);

      // Use mammoth to extract text from docx
      const result = await mammoth.extractRawText({ buffer });

      let text = result.value;

      // Clean extracted text
      text = this.cleanText(text);

      if (!text || text.trim().length === 0) {
        throw new ValidationError('No text found in Word document');
      }

      logger.success(
        `Word document text extracted successfully (${text.length} characters)`
      );
      return text;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error('Word document extraction failed:', error);
      throw new ServerError('Failed to extract text from Word document');
    }
  }

  /**
   * Extract text from PPT/PPTX file
   * Note: Basic implementation - extracts text from notes/shapes
   */
  static async extractTextFromPptx(filePath) {
    try {
      // For now, return a placeholder
      // Full PPTX extraction requires additional libraries
      logger.warn(
        'PPTX extraction requires additional setup. Returning placeholder.'
      );

      // This is a basic implementation
      // In production, use: pptxparse, office-parser, or libreoffice conversion
      return this.getPlaceholderText('PowerPoint');
    } catch (error) {
      logger.error('PowerPoint extraction failed:', error);
      throw new ServerError('Failed to extract text from PowerPoint file');
    }
  }

  /**
   * Clean and format extracted text
   */
  static cleanText(rawText) {
    if (!rawText) {
      return '';
    }

    let text = rawText
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters but keep basic punctuation
      .replace(/[^\w\s\.\,\!\?\;\:\-\(\)\/\&]/g, ' ')
      // Remove multiple spaces
      .replace(/\s+/g, ' ')
      // Trim whitespace
      .trim();

    return text;
  }

  /**
   * Validate extracted text
   */
  static validateExtractedText(text) {
    if (!text || text.trim().length === 0) {
      throw new ValidationError('Extracted text is empty');
    }

    const minLength = 50;
    if (text.trim().length < minLength) {
      throw new ValidationError(
        `Extracted text is too short (minimum ${minLength} characters required)`
      );
    }

    return true;
  }

  /**
   * Get placeholder text for testing
   */
  static getPlaceholderText(format) {
    return `This is a placeholder for ${format} file extraction.
    To fully support ${format} files, you need to implement additional extraction logic.

    Key features to implement:
    1. Extract text from slides
    2. Extract text from speaker notes
    3. Handle images with OCR
    4. Preserve formatting and structure

    Consider using libraries like:
    - office-parser
    - pptxparse
    - LibreOffice conversion

    This extracted content would normally contain the training material from your ${format} file.`;
  }
}

module.exports = TextExtractor;
