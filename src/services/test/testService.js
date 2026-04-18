const Test = require('../../models/Test');
const Question = require('../../models/Question');
const Section = require('../../models/Section');
const {
  NotFoundError,
  ValidationError,
  ServerError,
} = require('../../utils/errorTypes');
const logger = require('../../utils/logger');

class TestService {
  async createTest(data, createdBy) {
    try {
      const {
        title,
        moduleId,
        description,
        totalMarks,
        passingMarks,
        timeLimit,
        status,
        shuffleQuestions,
        shuffleOptions,
        allowMultipleAttempts,
        maxAttempts,
        responseVisibility,
        autoSubmitOnTimeEnd,
        feedbackText,
        requireEmail,
        showProgressBar,
        randomizeQuestionOrder,
      } = data;

      if (!title) {
        throw new ValidationError('Title is required');
      }

      const test = new Test({
        title,
        moduleId: moduleId || null,
        description: description || '',
        totalMarks: totalMarks || 100,
        passingMarks: passingMarks || 50,
        timeLimit: timeLimit || 60,
        status: status || 'draft',
        createdBy,
        shuffleQuestions: shuffleQuestions || false,
        shuffleOptions: shuffleOptions || false,
        allowMultipleAttempts: allowMultipleAttempts || false,
        maxAttempts: maxAttempts || null,
        responseVisibility: responseVisibility || 'score_only',
        autoSubmitOnTimeEnd: autoSubmitOnTimeEnd || false,
        feedbackText: feedbackText || '',
        requireEmail: requireEmail || false,
        showProgressBar: showProgressBar !== false, // Default true
        randomizeQuestionOrder: randomizeQuestionOrder || false,
        settingsUpdatedAt: new Date(),
      });

      await test.save();
      logger.success(`Test created: ${test._id}`);
      return test;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ServerError(`Failed to create test: ${error.message}`);
    }
  }

  async listTests(filters = {}, pagination = {}) {
    try {
      const { moduleId, status } = filters;
      const { limit = 10, skip = 0, sort = '-createdAt' } = pagination;

      const query = {};
      if (moduleId) query.moduleId = moduleId;
      if (status) query.status = status;

      const tests = await Test.find(query)
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .populate('moduleId', 'title').populate('categoryId', 'name type')
        .populate('createdBy', 'name email');

      const total = await Test.countDocuments(query);

      return {
        data: tests,
        pagination: {
          total,
          limit,
          skip,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new ServerError(`Failed to list tests: ${error.message}`);
    }
  }

  async getTestById(testId) {
    try {
      const test = await Test.findById(testId)
        .populate('moduleId', 'title').populate('categoryId', 'name type')
        .populate('createdBy', 'name email');

      if (!test) {
        throw new NotFoundError('Test not found');
      }

      return test;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new ServerError(`Failed to fetch test: ${error.message}`);
    }
  }

  async getTestWithQuestions(testId) {
    try {
      const test = await Test.findById(testId)
        .populate('moduleId', 'title').populate('categoryId', 'name type')
        .populate('createdBy', 'name email');

      if (!test) {
        throw new NotFoundError('Test not found');
      }

      const questions = await Question.find({ testId }).sort('order');

      return {
        ...test.toObject(),
        questions,
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new ServerError(`Failed to fetch test with questions: ${error.message}`);
    }
  }

  async updateTest(testId, data) {
    try {
      const allowedFields = [
        'title',
        'description',
        'totalMarks',
        'passingMarks',
        'timeLimit',
        'status',
        'shuffleQuestions',
        'shuffleOptions',
        'allowMultipleAttempts',
        'maxAttempts',
        'responseVisibility',
        'autoSubmitOnTimeEnd',
        'feedbackText',
        'requireEmail',
        'showProgressBar',
        'randomizeQuestionOrder',
      ];
      const updates = {};

      allowedFields.forEach((field) => {
        if (data[field] !== undefined) {
          updates[field] = data[field];
        }
      });

      // Track when settings were updated
      if (
        data.shuffleQuestions !== undefined ||
        data.shuffleOptions !== undefined ||
        data.allowMultipleAttempts !== undefined ||
        data.maxAttempts !== undefined ||
        data.responseVisibility !== undefined ||
        data.autoSubmitOnTimeEnd !== undefined ||
        data.feedbackText !== undefined ||
        data.requireEmail !== undefined ||
        data.showProgressBar !== undefined ||
        data.randomizeQuestionOrder !== undefined
      ) {
        updates.settingsUpdatedAt = new Date();
      }

      const test = await Test.findByIdAndUpdate(
        testId,
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!test) {
        throw new NotFoundError('Test not found');
      }

      logger.success(`Test updated: ${testId}`);
      return test;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new ServerError(`Failed to update test: ${error.message}`);
    }
  }

  async deleteTest(testId) {
    try {
      const test = await Test.findByIdAndDelete(testId);

      if (!test) {
        throw new NotFoundError('Test not found');
      }

      // Also delete associated questions
      await Question.deleteMany({ testId });

      logger.success(`Test deleted: ${testId}`);
      return test;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new ServerError(`Failed to delete test: ${error.message}`);
    }
  }

  async publishTest(testId) {
    try {
      const test = await Test.findByIdAndUpdate(
        testId,
        { status: 'published', updatedAt: new Date() },
        { new: true }
      );

      if (!test) {
        throw new NotFoundError('Test not found');
      }

      logger.success(`Test published: ${testId}`);
      return test;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new ServerError(`Failed to publish test: ${error.message}`);
    }
  }

  async addQuestion(testId, questionData) {
    try {
      const {
        questionText,
        description,
        type,
        options,
        correctAnswer,
        correctAnswers,
        marks,
        order,
        isRequired,
        questionImage,
        shuffleOptions,
        showOtherOption,
        scaleMin,
        scaleMax,
        scaleMinLabel,
        scaleMaxLabel,
        allowedFileTypes,
        maxFileSize,
        answerKey,
        feedback,
        validationRules,
        conditionalLogic,
        sectionId,
        pageBreak,
        imageUrl,
        videoUrl,
      } = questionData;

      if (!questionText || !type) {
        throw new ValidationError('Question text and type are required');
      }

      // Get next order if not provided
      let questionOrder = order;
      if (questionOrder === undefined) {
        const lastQuestion = await Question.findOne({ testId }).sort('-order');
        questionOrder = (lastQuestion?.order || 0) + 1;
      }

      const question = new Question({
        testId,
        questionText,
        description: description || '',
        type,
        options,
        correctAnswer,
        correctAnswers,
        marks: marks || 1,
        order: questionOrder,
        isRequired: isRequired || false,
        questionImage: questionImage || null,
        shuffleOptions: shuffleOptions || false,
        showOtherOption: showOtherOption || false,
        scaleMin: scaleMin || 1,
        scaleMax: scaleMax || 5,
        scaleMinLabel: scaleMinLabel || '',
        scaleMaxLabel: scaleMaxLabel || '',
        allowedFileTypes: allowedFileTypes || [],
        maxFileSize: maxFileSize || 10,
        // New Google Forms fields
        answerKey: answerKey || '',
        feedback: feedback || '',
        validationRules: validationRules || {},
        conditionalLogic: conditionalLogic || [],
        sectionId: sectionId || null,
        pageBreak: pageBreak || false,
        imageUrl: imageUrl || null,
        videoUrl: videoUrl || null,
      });

      await question.save();
      logger.success(`Question added: ${question._id}`);
      return question;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ServerError(`Failed to add question: ${error.message}`);
    }
  }

  async updateQuestion(questionId, data) {
    try {
      const allowedFields = [
        'questionText',
        'description',
        'type',
        'options',
        'correctAnswer',
        'correctAnswers',
        'marks',
        'order',
        'isRequired',
        'questionImage',
        'shuffleOptions',
        'showOtherOption',
        'scaleMin',
        'scaleMax',
        'scaleMinLabel',
        'scaleMaxLabel',
        'allowedFileTypes',
        'maxFileSize',
        'answerKey',
        'feedback',
        'validationRules',
        'conditionalLogic',
        'sectionId',
        'pageBreak',
        'imageUrl',
        'videoUrl',
      ];
      const updates = {};

      allowedFields.forEach((field) => {
        if (data[field] !== undefined) {
          updates[field] = data[field];
        }
      });

      const question = await Question.findByIdAndUpdate(
        questionId,
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!question) {
        throw new NotFoundError('Question not found');
      }

      logger.success(`Question updated: ${questionId}`);
      return question;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new ServerError(`Failed to update question: ${error.message}`);
    }
  }

  async deleteQuestion(questionId) {
    try {
      const question = await Question.findByIdAndDelete(questionId);

      if (!question) {
        throw new NotFoundError('Question not found');
      }

      logger.success(`Question deleted: ${questionId}`);
      return question;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new ServerError(`Failed to delete question: ${error.message}`);
    }
  }

  async getTestQuestions(testId, includeAnswers = false) {
    try {
      const questions = await Question.find({ testId }).sort('order');

      if (!includeAnswers) {
        // Remove correct answers for user view
        return questions.map((q) => {
          const qObj = q.toObject();
          delete qObj.correctAnswer;
          if (qObj.options) {
            qObj.options = qObj.options.map((opt) => ({
              text: opt.text,
            }));
          }
          return qObj;
        });
      }

      return questions;
    } catch (error) {
      throw new ServerError(`Failed to fetch test questions: ${error.message}`);
    }
  }

  // Section Management Methods
  async createSection(testId, sectionData) {
    try {
      const { title, description, order, pageBreakBefore, pageBreakAfter } = sectionData;

      if (!title) {
        throw new ValidationError('Section title is required');
      }

      // Get next order if not provided
      let sectionOrder = order;
      if (sectionOrder === undefined) {
        const lastSection = await Section.findOne({ testId }).sort('-order');
        sectionOrder = (lastSection?.order || 0) + 1;
      }

      const section = new Section({
        testId,
        title,
        description: description || '',
        order: sectionOrder,
        pageBreakBefore: pageBreakBefore || false,
        pageBreakAfter: pageBreakAfter || false,
      });

      await section.save();
      logger.success(`Section created: ${section._id}`);
      return section;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ServerError(`Failed to create section: ${error.message}`);
    }
  }

  async getTestSections(testId) {
    try {
      const sections = await Section.find({ testId }).sort('order');
      return sections;
    } catch (error) {
      throw new ServerError(`Failed to fetch test sections: ${error.message}`);
    }
  }

  async updateSection(sectionId, data) {
    try {
      const allowedFields = ['title', 'description', 'order', 'pageBreakBefore', 'pageBreakAfter'];
      const updates = {};

      allowedFields.forEach((field) => {
        if (data[field] !== undefined) {
          updates[field] = data[field];
        }
      });

      const section = await Section.findByIdAndUpdate(
        sectionId,
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!section) {
        throw new NotFoundError('Section not found');
      }

      logger.success(`Section updated: ${sectionId}`);
      return section;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new ServerError(`Failed to update section: ${error.message}`);
    }
  }

  async deleteSection(sectionId) {
    try {
      const section = await Section.findByIdAndDelete(sectionId);

      if (!section) {
        throw new NotFoundError('Section not found');
      }

      // Update questions to remove sectionId reference
      await Question.updateMany({ sectionId }, { sectionId: null });

      logger.success(`Section deleted: ${sectionId}`);
      return section;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new ServerError(`Failed to delete section: ${error.message}`);
    }
  }

  // Conditional Logic Validation
  validateConditionalLogic(conditionalLogic, allQuestionIds) {
    try {
      if (!conditionalLogic || !Array.isArray(conditionalLogic)) {
        return true; // No validation needed for empty/missing logic
      }

      for (const condition of conditionalLogic) {
        // Validate trigger question exists
        if (condition.triggerQuestionId && !allQuestionIds.includes(condition.triggerQuestionId.toString())) {
          throw new ValidationError(
            `Trigger question ${condition.triggerQuestionId} not found in test`
          );
        }

        // Validate target question exists
        if (condition.targetQuestionId && !allQuestionIds.includes(condition.targetQuestionId.toString())) {
          throw new ValidationError(
            `Target question ${condition.targetQuestionId} not found in test`
          );
        }

        // Validate condition type
        const validConditions = ['equals', 'contains', 'greaterThan', 'lessThan', 'isEmpty', 'isNotEmpty'];
        if (!validConditions.includes(condition.condition)) {
          throw new ValidationError(`Invalid condition type: ${condition.condition}`);
        }

        // Validate action type
        const validActions = ['show', 'hide', 'require'];
        if (!validActions.includes(condition.action)) {
          throw new ValidationError(`Invalid action type: ${condition.action}`);
        }
      }

      return true;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ServerError(`Conditional logic validation failed: ${error.message}`);
    }
  }

  // Validation Rules Helper
  validateValidationRules(validationRules, questionType) {
    try {
      if (!validationRules) {
        return true;
      }

      const { type, pattern, minValue, maxValue, minLength, maxLength, allowedFileTypes, customMessage } =
        validationRules;

      if (!type) {
        return true; // No validation rules configured
      }

      // Validate rule type is supported
      const supportedTypes = ['email', 'number', 'url', 'regex', 'textLength', 'fileType', 'phone', 'custom'];
      if (!supportedTypes.includes(type)) {
        throw new ValidationError(`Unsupported validation type: ${type}`);
      }

      // Type-specific validation
      switch (type) {
        case 'regex':
          if (!pattern) {
            throw new ValidationError('Regex pattern is required for regex validation');
          }
          try {
            new RegExp(pattern);
          } catch (e) {
            throw new ValidationError(`Invalid regex pattern: ${e.message}`);
          }
          break;
        case 'number':
          if (minValue !== undefined && maxValue !== undefined && minValue > maxValue) {
            throw new ValidationError('minValue cannot be greater than maxValue');
          }
          break;
        case 'textLength':
          if (minLength !== undefined && maxLength !== undefined && minLength > maxLength) {
            throw new ValidationError('minLength cannot be greater than maxLength');
          }
          break;
        case 'fileType':
          if (!Array.isArray(allowedFileTypes) || allowedFileTypes.length === 0) {
            throw new ValidationError('At least one allowed file type must be specified');
          }
          break;
      }

      return true;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ServerError(`Validation rules error: ${error.message}`);
    }
  }
}

module.exports = new TestService();
