const testService = require('../../services/test/testService');
const attemptService = require('../../services/test/attemptService');
const { ValidationError } = require('../../utils/errorTypes');

class UserTestController {
  async getTest(req, res, next) {
    try {
      const questions = await testService.getTestQuestions(
        req.params.id,
        false
      );

      res.status(200).json({
        success: true,
        data: questions,
      });
    } catch (error) {
      next(error);
    }
  }

  async startAttempt(req, res, next) {
    try {
      const attempt = await attemptService.startAttempt(
        req.params.id,
        req.user.id
      );

      res.status(200).json({
        success: true,
        message: 'Test attempt started',
        data: attempt,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAttempt(req, res, next) {
    try {
      const { answers } = req.body;

      if (!answers || !Array.isArray(answers)) {
        throw new ValidationError('Answers array is required');
      }

      const attempt = await attemptService.updateAttemptAnswers(
        req.params.id,
        req.params.attemptId,
        req.user.id,
        answers
      );

      res.status(200).json({
        success: true,
        message: 'Attempt answers updated',
        data: attempt,
      });
    } catch (error) {
      next(error);
    }
  }

  async submitTest(req, res, next) {
    try {
      const attempt = await attemptService.submitAttempt(
        req.params.id,
        req.body.attemptId,
        req.user.id
      );

      res.status(200).json({
        success: true,
        message: 'Test submitted successfully',
        data: {
          attemptId: attempt._id,
          marksObtained: attempt.marksObtained,
          totalMarks: attempt.totalMarks,
          percentage: (
            (attempt.marksObtained / attempt.totalMarks) *
            100
          ).toFixed(2),
          status: attempt.status,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserAttempts(req, res, next) {
    try {
      const { limit = 10, skip = 0, sort = '-attemptedAt' } = req.query;

      const result = await attemptService.getUserAttempts(
        req.params.id,
        req.user.id,
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

  async getAttemptResult(req, res, next) {
    try {
      const result = await attemptService.getAttemptResult(
        req.params.id,
        req.params.attemptId,
        req.user.id
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserTestController();
