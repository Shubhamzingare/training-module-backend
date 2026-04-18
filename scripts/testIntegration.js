/**
 * Integration Test Script
 * Tests all newly implemented services
 *
 * Usage: node scripts/testIntegration.js
 */

const fs = require('fs');
const path = require('path');

// Import services
const FileService = require('../src/services/file/fileService');
const TextExtractor = require('../src/services/file/textExtractor');
const ClaudeService = require('../src/services/ai/claudeService');
const ContentGeneratorService = require('../src/services/module/contentGeneratorService');
const logger = require('../src/utils/logger');

const tests = [];

/**
 * Test 1: File Service
 */
tests.push({
  name: 'File Service - Filename Sanitization',
  run: async () => {
    const filename = 'Test @Document (2024).pdf';
    const sanitized = FileService.sanitizeFilename(filename);
    logger.info(`Original: ${filename}`);
    logger.info(`Sanitized: ${sanitized}`);
    return sanitized.length > 0 && !sanitized.includes('@');
  }
});

/**
 * Test 2: Text Extraction - Content Cleaning
 */
tests.push({
  name: 'Text Extractor - Text Cleaning',
  run: async () => {
    const rawText = 'This   is   a   test\n\nWith   extra    spaces and @#$% symbols!';
    const cleaned = TextExtractor.cleanText(rawText);
    logger.info(`Original: "${rawText}"`);
    logger.info(`Cleaned: "${cleaned}"`);
    return cleaned.length > 0 && !cleaned.includes('@');
  }
});

/**
 * Test 3: Claude Service - Initialization
 */
tests.push({
  name: 'Claude Service - Initialization',
  run: async () => {
    try {
      const client = ClaudeService.initialize();
      logger.success('Claude client initialized successfully');
      return client !== null;
    } catch (error) {
      if (error.message.includes('CLAUDE_API_KEY')) {
        logger.warn('Claude API key not configured - set CLAUDE_API_KEY in .env');
        return true; // Pass test - this is expected in dev
      }
      throw error;
    }
  }
});

/**
 * Test 4: JSON Response Parsing
 */
tests.push({
  name: 'Claude Service - JSON Parsing',
  run: async () => {
    const mockResponse = 'Here is the array: ["point 1", "point 2", "point 3"]';
    const parsed = ClaudeService.parseJsonResponse(mockResponse);
    logger.info(`Parsed: ${JSON.stringify(parsed)}`);
    return Array.isArray(parsed) && parsed.length === 3;
  }
});

/**
 * Test 5: Fallback Content Generation
 */
tests.push({
  name: 'Claude Service - Fallback Key Points',
  run: async () => {
    const fallback = ClaudeService.generateFallbackKeyPoints();
    logger.info(`Generated ${fallback.length} fallback key points`);
    return Array.isArray(fallback) && fallback.length > 0;
  }
});

/**
 * Test 6: Fallback FAQs
 */
tests.push({
  name: 'Claude Service - Fallback FAQs',
  run: async () => {
    const fallback = ClaudeService.generateFallbackFAQs();
    logger.info(`Generated ${fallback.length} fallback FAQs`);
    return Array.isArray(fallback) && fallback[0].question && fallback[0].answer;
  }
});

/**
 * Test 7: Content Generator - Mark Calculation
 */
tests.push({
  name: 'Content Generator - Mark Calculation',
  run: async () => {
    const questions = [
      { type: 'mcq', marks: 1 },
      { type: 'mcq', marks: 2 },
      { type: 'descriptive', marks: 5 },
    ];
    const total = ContentGeneratorService.calculateTotalMarks(questions);
    logger.info(`Total marks: ${total}`);
    return total === 8;
  }
});

/**
 * Test 8: Content Generator - Extract Correct Answer
 */
tests.push({
  name: 'Content Generator - Extract Correct Answer',
  run: async () => {
    const options = [
      { text: 'Option 1', isCorrect: false },
      { text: 'Option 2', isCorrect: true },
      { text: 'Option 3', isCorrect: false },
    ];
    const correct = ContentGeneratorService.extractCorrectAnswer(options);
    logger.info(`Correct answer: ${correct}`);
    return correct === 'Option 2';
  }
});

/**
 * Run all tests
 */
async function runTests() {
  logger.info('===== Integration Tests =====');
  logger.info(`Running ${tests.length} tests...\n`);

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      logger.info(`Test: ${test.name}`);
      const result = await test.run();

      if (result) {
        logger.success(`PASSED: ${test.name}\n`);
        passed++;
      } else {
        logger.error(`FAILED: ${test.name}\n`);
        failed++;
      }
    } catch (error) {
      logger.error(`ERROR: ${test.name}`, error.message);
      logger.error(`${error.message}\n`);
      failed++;
    }
  }

  logger.info('===== Test Summary =====');
  logger.success(`Passed: ${passed}/${tests.length}`);
  if (failed > 0) {
    logger.error(`Failed: ${failed}/${tests.length}`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch((error) => {
    logger.error('Test runner error:', error);
    process.exit(1);
  });
}

module.exports = { tests, runTests };
