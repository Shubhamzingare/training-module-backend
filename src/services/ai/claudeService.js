const { Anthropic } = require('@anthropic-ai/sdk');
const logger = require('../../utils/logger');
const { ValidationError, ServerError } = require('../../utils/errorTypes');
const env = require('../../config/env');

/**
 * Claude AI Service - Generate training content using Claude API
 */
class ClaudeService {
  static client = null;
  static model = env.CLAUDE_MODEL;
  static maxRetries = 3;
  static timeout = 30000;

  /**
   * Initialize Claude client
   */
  static initialize() {
    if (!this.client) {
      if (!env.CLAUDE_API_KEY) {
        throw new ServerError('CLAUDE_API_KEY is not configured');
      }

      this.client = new Anthropic({
        apiKey: env.CLAUDE_API_KEY,
      });

      logger.success('Claude API client initialized');
    }
    return this.client;
  }

  /**
   * Call Claude API with retry logic
   */
  static async callClaudeWithRetry(prompt, maxTokens = 2000) {
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        logger.info(`Claude API call (Attempt ${attempt}/${this.maxRetries})`);

        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: maxTokens,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
        });

        if (!response.content || !response.content[0]) {
          throw new ServerError('Empty response from Claude API');
        }

        logger.success('Claude API call successful');
        return response.content[0].text;
      } catch (error) {
        lastError = error;

        // Check if it's a retryable error
        if (
          error.status === 429 ||
          error.status === 500 ||
          error.status === 503
        ) {
          if (attempt < this.maxRetries) {
            const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
            logger.warn(
              `Rate limited or server error. Retrying in ${delay}ms...`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
        }

        // Non-retryable error
        logger.error(`Claude API error on attempt ${attempt}:`, error.message);
        throw error;
      }
    }

    throw new ServerError(
      `Claude API failed after ${this.maxRetries} attempts: ${lastError.message}`
    );
  }

  /**
   * Generate key learning points from content
   */
  static async generateKeyPoints(content) {
    if (!content || content.trim().length === 0) {
      throw new ValidationError('Content is required to generate key points');
    }

    const prompt = `Extract 5-7 key learning points from the following training content.
Each point should be 1-2 lines maximum and capture essential information.
Return ONLY a JSON array of strings, nothing else.

Content:
${content.substring(0, 3000)}

Return format:
["Point 1", "Point 2", ..., "Point 7"]`;

    try {
      logger.info('Generating key points...');
      const response = await this.callClaudeWithRetry(prompt, 1000);

      // Parse JSON response
      const keyPoints = this.parseJsonResponse(response);

      if (!Array.isArray(keyPoints)) {
        throw new ServerError('Invalid response format from Claude');
      }

      logger.success(`Generated ${keyPoints.length} key points`);
      return keyPoints;
    } catch (error) {
      logger.error('Key points generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate FAQs from content
   */
  static async generateFAQs(content) {
    if (!content || content.trim().length === 0) {
      throw new ValidationError('Content is required to generate FAQs');
    }

    const prompt = `Create 8-10 FAQ (Frequently Asked Questions) pairs from the following training content.
Each FAQ should be clear and comprehensive.
Return ONLY a JSON array of objects with "question" and "answer" fields, nothing else.

Content:
${content.substring(0, 3000)}

Return format:
[
  {"question": "What is...", "answer": "..."},
  {"question": "How do...", "answer": "..."},
  ...
]`;

    try {
      logger.info('Generating FAQs...');
      const response = await this.callClaudeWithRetry(prompt, 2000);

      // Parse JSON response
      const faqs = this.parseJsonResponse(response);

      if (!Array.isArray(faqs)) {
        throw new ServerError('Invalid response format from Claude');
      }

      // Validate FAQ structure
      const validFaqs = faqs.filter(
        (faq) => faq.question && faq.answer && typeof faq.question === 'string'
      );

      logger.success(`Generated ${validFaqs.length} FAQs`);
      return validFaqs;
    } catch (error) {
      logger.error('FAQ generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate test questions from content
   */
  static async generateTestQuestions(content) {
    if (!content || content.trim().length === 0) {
      throw new ValidationError(
        'Content is required to generate test questions'
      );
    }

    const prompt = `Generate 10 test questions from the following training content.
70% should be Multiple Choice Questions (MCQ) with exactly 4 options each.
30% should be Descriptive/Essay type questions.

For MCQ questions, exactly one option should have "isCorrect": true.
Each question should have "marks" value (MCQ: 1-2, Descriptive: 3-5).

Return ONLY a JSON array of question objects, nothing else.

Content:
${content.substring(0, 3000)}

Return format:
[
  {
    "questionText": "Question text here?",
    "type": "mcq",
    "options": [
      {"text": "Option 1", "isCorrect": false},
      {"text": "Option 2", "isCorrect": true},
      {"text": "Option 3", "isCorrect": false},
      {"text": "Option 4", "isCorrect": false}
    ],
    "marks": 1
  },
  {
    "questionText": "Describe...",
    "type": "descriptive",
    "marks": 4
  },
  ...
]`;

    try {
      logger.info('Generating test questions...');
      const response = await this.callClaudeWithRetry(prompt, 3000);

      // Parse JSON response
      const questions = this.parseJsonResponse(response);

      if (!Array.isArray(questions)) {
        throw new ServerError('Invalid response format from Claude');
      }

      // Validate and fix questions
      const validQuestions = questions
        .filter((q) => q.questionText && q.type)
        .map((q, index) => ({
          ...q,
          marks: q.marks || (q.type === 'mcq' ? 1 : 3),
        }));

      logger.success(`Generated ${validQuestions.length} test questions`);
      return validQuestions;
    } catch (error) {
      logger.error('Test questions generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Parse JSON response from Claude
   */
  static parseJsonResponse(response) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.error('Failed to parse JSON response:', error.message);
      logger.debug('Response was:', response);
      throw new ServerError('Failed to parse Claude response');
    }
  }

  /**
   * Generate fallback key points if Claude fails
   */
  static generateFallbackKeyPoints() {
    return [
      'Content was extracted successfully from the training material',
      'Key concepts should be identified and summarized',
      'Learning objectives should align with organizational goals',
      'Content should be reviewed and validated before publishing',
      'Regular updates ensure relevance and accuracy',
    ];
  }

  /**
   * Generate fallback FAQs if Claude fails
   */
  static generateFallbackFAQs() {
    return [
      {
        question: 'What is the main objective of this training?',
        answer:
          'The training module is designed to provide comprehensive knowledge and skills related to the topic covered in the source material.',
      },
      {
        question: 'How should this content be used?',
        answer:
          'This content should be reviewed by administrators, integrated with additional resources, and presented to users in a structured learning path.',
      },
    ];
  }

  /**
   * Test Claude connection
   */
  static async testConnection() {
    try {
      logger.info('Testing Claude API connection...');

      const testPrompt = 'Respond with a single word: "connected"';
      const response = await this.callClaudeWithRetry(testPrompt, 10);

      logger.success('Claude API connection successful');
      return true;
    } catch (error) {
      logger.error('Claude API connection failed:', error.message);
      return false;
    }
  }
}

module.exports = ClaudeService;
