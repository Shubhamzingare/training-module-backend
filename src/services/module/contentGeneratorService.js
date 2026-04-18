const logger = require('../../utils/logger');
const { ServerError, ValidationError } = require('../../utils/errorTypes');
const ClaudeService = require('../ai/claudeService');
const TextExtractor = require('../file/textExtractor');
const ModuleContent = require('../../models/ModuleContent');
const Module = require('../../models/Module');
const Test = require('../../models/Test');
const Question = require('../../models/Question');
const { QUESTION_TYPES } = require('../../config/constants');

/**
 * Module Content Generator Service
 * Orchestrates text extraction and content generation
 */
class ContentGeneratorService {
  /**
   * Extract text from file and generate all content
   */
  static async generateAndSaveContent(moduleId, filePath, fileType) {
    try {
      logger.info(`Starting content generation for module: ${moduleId}`);

      // Extract text from file
      logger.info(`Extracting text from file (${fileType})`);
      const rawText = await TextExtractor.extractText(filePath, fileType);

      // Validate extracted text
      TextExtractor.validateExtractedText(rawText);

      // Generate content using Claude
      const generatedContent = await this.generateModuleContent(
        moduleId,
        rawText
      );

      // Save to database
      const savedContent = await this.saveModuleContent(
        moduleId,
        rawText,
        generatedContent
      );

      logger.success('Content generation and save completed');
      return savedContent;
    } catch (error) {
      logger.error('Content generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate key points, FAQs, and questions from raw text
   */
  static async generateModuleContent(moduleId, rawText) {
    try {
      logger.info('Generating module content from raw text...');

      // Initialize Claude
      ClaudeService.initialize();

      let keyPoints = [];
      let faqs = [];
      let testQuestions = [];

      // Generate key points
      try {
        logger.info('Generating key points...');
        keyPoints = await ClaudeService.generateKeyPoints(rawText);
      } catch (error) {
        logger.warn('Key points generation failed, using fallback:', error.message);
        keyPoints = ClaudeService.generateFallbackKeyPoints();
      }

      // Generate FAQs
      try {
        logger.info('Generating FAQs...');
        faqs = await ClaudeService.generateFAQs(rawText);
      } catch (error) {
        logger.warn('FAQ generation failed, using fallback:', error.message);
        faqs = ClaudeService.generateFallbackFAQs();
      }

      // Generate test questions
      try {
        logger.info('Generating test questions...');
        testQuestions = await ClaudeService.generateTestQuestions(rawText);
      } catch (error) {
        logger.warn(
          'Test questions generation failed, using empty array:',
          error.message
        );
        testQuestions = [];
      }

      return {
        keyPoints,
        faqs,
        testQuestions,
        success: true,
      };
    } catch (error) {
      logger.error('Content generation failed:', error.message);
      throw new ServerError('Failed to generate module content');
    }
  }

  /**
   * Save generated content to database
   */
  static async saveModuleContent(
    moduleId,
    rawText,
    { keyPoints, faqs, testQuestions }
  ) {
    try {
      logger.info(`Saving content for module: ${moduleId}`);

      // Check if content already exists
      let moduleContent = await ModuleContent.findOne({ moduleId });

      if (moduleContent) {
        // Update existing content
        moduleContent.keyPoints = keyPoints;
        moduleContent.faqs = faqs;
        moduleContent.rawContent = rawText;
        moduleContent.generatedBy = 'claude';
        await moduleContent.save();
        logger.success('Module content updated');
      } else {
        // Create new content
        moduleContent = new ModuleContent({
          moduleId,
          keyPoints,
          faqs,
          rawContent: rawText,
          generatedBy: 'claude',
        });
        await moduleContent.save();
        logger.success('Module content created');
      }

      // Create test if questions were generated
      if (testQuestions && testQuestions.length > 0) {
        await this.createTestWithQuestions(
          moduleId,
          testQuestions,
          rawText
        );
      }

      return {
        success: true,
        moduleContent: {
          id: moduleContent._id,
          moduleId: moduleContent.moduleId,
          keyPoints: moduleContent.keyPoints,
          faqs: moduleContent.faqs,
          generatedBy: moduleContent.generatedBy,
          createdAt: moduleContent.createdAt,
        },
        testCreated: testQuestions.length > 0,
        questionsCount: testQuestions.length,
      };
    } catch (error) {
      logger.error('Failed to save module content:', error.message);
      throw new ServerError('Failed to save generated content');
    }
  }

  /**
   * Create test with generated questions
   */
  static async createTestWithQuestions(
    moduleId,
    testQuestions,
    contentSummary
  ) {
    try {
      logger.info(`Creating test for module: ${moduleId}`);

      // Get module info
      const module = await Module.findById(moduleId);
      if (!module) {
        throw new ValidationError('Module not found');
      }

      // Create test
      const test = new Test({
        title: `${module.title} - Auto-Generated Test`,
        moduleId,
        description: `Auto-generated test based on module content. Contains ${testQuestions.length} questions.`,
        totalMarks: this.calculateTotalMarks(testQuestions),
        status: 'draft',
        createdBy: module.createdBy,
      });

      const savedTest = await test.save();
      logger.info(`Test created: ${savedTest._id}`);

      // Create questions
      const questions = testQuestions.map((q, index) => ({
        testId: savedTest._id,
        questionText: q.questionText,
        type: q.type || QUESTION_TYPES.MCQ,
        options: q.options || [],
        correctAnswer:
          q.type === QUESTION_TYPES.MCQ
            ? this.extractCorrectAnswer(q.options)
            : q.correctAnswer,
        marks: q.marks || (q.type === QUESTION_TYPES.MCQ ? 1 : 3),
        order: index + 1,
      }));

      await Question.insertMany(questions);
      logger.success(
        `Created ${questions.length} questions for test: ${savedTest._id}`
      );

      return {
        testId: savedTest._id,
        questionsCount: questions.length,
        totalMarks: savedTest.totalMarks,
      };
    } catch (error) {
      logger.warn('Failed to create test with questions:', error.message);
      // Don't throw - content generation should not fail due to test creation
      return null;
    }
  }

  /**
   * Calculate total marks for test
   */
  static calculateTotalMarks(questions) {
    if (!Array.isArray(questions)) {
      return 100;
    }

    const total = questions.reduce((sum, q) => {
      return sum + (q.marks || (q.type === 'mcq' ? 1 : 3));
    }, 0);

    return total || 100;
  }

  /**
   * Extract correct answer from options
   */
  static extractCorrectAnswer(options) {
    if (!Array.isArray(options)) {
      return '';
    }

    const correctOption = options.find((opt) => opt.isCorrect);
    return correctOption ? correctOption.text : options[0]?.text || '';
  }

  /**
   * Update module content manually
   */
  static async updateModuleContent(moduleId, { keyPoints, faqs }) {
    try {
      logger.info(`Updating content for module: ${moduleId}`);

      const moduleContent = await ModuleContent.findOne({ moduleId });
      if (!moduleContent) {
        throw new ValidationError('Module content not found');
      }

      if (keyPoints && Array.isArray(keyPoints)) {
        moduleContent.keyPoints = keyPoints;
      }

      if (faqs && Array.isArray(faqs)) {
        moduleContent.faqs = faqs;
      }

      moduleContent.generatedBy = 'manual';
      await moduleContent.save();

      logger.success('Module content updated');
      return moduleContent;
    } catch (error) {
      logger.error('Failed to update module content:', error.message);
      throw error;
    }
  }

  /**
   * Get module content
   */
  static async getModuleContent(moduleId) {
    try {
      const content = await ModuleContent.findOne({ moduleId });
      if (!content) {
        throw new ValidationError('Module content not found');
      }
      return content;
    } catch (error) {
      logger.error('Failed to get module content:', error.message);
      throw error;
    }
  }

  /**
   * Delete module content
   */
  static async deleteModuleContent(moduleId) {
    try {
      logger.info(`Deleting content for module: ${moduleId}`);

      await ModuleContent.deleteOne({ moduleId });
      logger.success('Module content deleted');

      // Also delete associated test
      const test = await Test.findOne({ moduleId });
      if (test) {
        await Question.deleteMany({ testId: test._id });
        await test.deleteOne();
        logger.success('Associated test deleted');
      }

      return true;
    } catch (error) {
      logger.error('Failed to delete module content:', error.message);
      throw new ServerError('Failed to delete module content');
    }
  }
}

module.exports = ContentGeneratorService;
