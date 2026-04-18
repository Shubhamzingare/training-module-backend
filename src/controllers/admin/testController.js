const testService = require('../../services/test/testService');
const { ValidationError } = require('../../utils/errorTypes');

class TestController {
  async createTest(req, res, next) {
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
      } = req.body;

      if (!title) {
        throw new ValidationError('Title is required');
      }

      const test = await testService.createTest(
        {
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
        },
        req.admin.id
      );

      res.status(201).json({
        success: true,
        message: 'Test created successfully',
        data: test,
      });
    } catch (error) {
      next(error);
    }
  }

  async listTests(req, res, next) {
    try {
      const { moduleId, status, limit = 10, skip = 0, sort = '-createdAt' } =
        req.query;

      const result = await testService.listTests(
        { moduleId, status },
        { limit: parseInt(limit), skip: parseInt(skip), sort }
      );

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTest(req, res, next) {
    try {
      const test = await testService.getTestWithQuestions(req.params.id);

      res.status(200).json({
        success: true,
        data: test,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTest(req, res, next) {
    try {
      const test = await testService.updateTest(req.params.id, req.body);

      res.status(200).json({
        success: true,
        message: 'Test updated successfully',
        data: test,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteTest(req, res, next) {
    try {
      const test = await testService.deleteTest(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Test deleted successfully',
        data: test,
      });
    } catch (error) {
      next(error);
    }
  }

  async publishTest(req, res, next) {
    try {
      const test = await testService.publishTest(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Test published successfully',
        data: test,
      });
    } catch (error) {
      next(error);
    }
  }

  async addQuestion(req, res, next) {
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
      } = req.body;

      if (!questionText || !type) {
        throw new ValidationError('Question text and type are required');
      }

      // Validate validation rules if provided
      if (validationRules) {
        testService.validateValidationRules(validationRules, type);
      }

      const question = await testService.addQuestion(req.params.id, {
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
      });

      res.status(201).json({
        success: true,
        message: 'Question added successfully',
        data: question,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateQuestion(req, res, next) {
    try {
      const question = await testService.updateQuestion(
        req.params.questionId,
        req.body
      );

      res.status(200).json({
        success: true,
        message: 'Question updated successfully',
        data: question,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteQuestion(req, res, next) {
    try {
      const question = await testService.deleteQuestion(req.params.questionId);

      res.status(200).json({
        success: true,
        message: 'Question deleted successfully',
        data: question,
      });
    } catch (error) {
      next(error);
    }
  }

  // Section Management Endpoints
  async createSection(req, res, next) {
    try {
      const { title, description, order, pageBreakBefore, pageBreakAfter } = req.body;

      if (!title) {
        throw new ValidationError('Section title is required');
      }

      const section = await testService.createSection(req.params.id, {
        title,
        description,
        order,
        pageBreakBefore,
        pageBreakAfter,
      });

      res.status(201).json({
        success: true,
        message: 'Section created successfully',
        data: section,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTestSections(req, res, next) {
    try {
      const sections = await testService.getTestSections(req.params.id);

      res.status(200).json({
        success: true,
        data: sections,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSection(req, res, next) {
    try {
      const section = await testService.updateSection(req.params.sectionId, req.body);

      res.status(200).json({
        success: true,
        message: 'Section updated successfully',
        data: section,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteSection(req, res, next) {
    try {
      const section = await testService.deleteSection(req.params.sectionId);

      res.status(200).json({
        success: true,
        message: 'Section deleted successfully',
        data: section,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TestController();
