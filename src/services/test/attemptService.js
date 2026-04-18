const TestAttempt = require('../../models/TestAttempt');
const Test = require('../../models/Test');
const Question = require('../../models/Question');
const {
  NotFoundError,
  ValidationError,
  ServerError,
} = require('../../utils/errorTypes');
const logger = require('../../utils/logger');

class AttemptService {
  async startAttempt(testId, userId) {
    try {
      const test = await Test.findById(testId);
      if (!test) {
        throw new NotFoundError('Test not found');
      }

      // Check for existing in-progress attempt
      const existingAttempt = await TestAttempt.findOne({
        testId,
        userId,
        status: 'in_progress',
      });

      if (existingAttempt) {
        return existingAttempt;
      }

      // Create new attempt
      const attempt = new TestAttempt({
        testId,
        userId,
        totalMarks: test.totalMarks,
        answers: [],
        status: 'in_progress',
      });

      await attempt.save();
      logger.success(`Test attempt started: ${attempt._id}`);
      return attempt;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new ServerError(`Failed to start test attempt: ${error.message}`);
    }
  }

  async updateAttemptAnswers(testId, attemptId, userId, answers) {
    try {
      const attempt = await TestAttempt.findOne({
        _id: attemptId,
        testId,
        userId,
      });

      if (!attempt) {
        throw new NotFoundError('Test attempt not found');
      }

      if (attempt.status !== 'in_progress') {
        throw new ValidationError('Cannot update a submitted attempt');
      }

      // Update answers
      attempt.answers = answers;
      await attempt.save();

      logger.success(`Test attempt answers updated: ${attemptId}`);
      return attempt;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError)
        throw error;
      throw new ServerError(
        `Failed to update attempt answers: ${error.message}`
      );
    }
  }

  async submitAttempt(testId, attemptId, userId) {
    try {
      const attempt = await TestAttempt.findOne({
        _id: attemptId,
        testId,
        userId,
      });

      if (!attempt) {
        throw new NotFoundError('Test attempt not found');
      }

      if (attempt.status === 'submitted') {
        throw new ValidationError('Attempt already submitted');
      }

      // Get all questions
      const questions = await Question.find({ testId });
      const questionMap = {};
      questions.forEach((q) => {
        questionMap[q._id.toString()] = q;
      });

      // Calculate marks
      let totalMarksObtained = 0;

      attempt.answers = attempt.answers.map((answer) => {
        const question = questionMap[answer.questionId.toString()];
        if (!question) return answer;

        let isCorrect = false;
        let marksObtained = 0;

        // Check answer
        if (question.type === 'mcq') {
          isCorrect =
            answer.userAnswer ===
            question.correctAnswer;
        }
        // For descriptive, mark as pending for manual evaluation
        else {
          answer.isCorrect = null; // Pending
        }

        if (isCorrect) {
          marksObtained = question.marks;
        }

        totalMarksObtained += marksObtained;

        return {
          ...answer,
          isCorrect: isCorrect || (isCorrect === false ? false : null),
          marksObtained,
        };
      });

      attempt.marksObtained = totalMarksObtained;
      attempt.status = 'submitted';
      attempt.completedAt = new Date();

      await attempt.save();
      logger.success(`Test attempt submitted: ${attemptId}`);
      return attempt;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError)
        throw error;
      throw new ServerError(
        `Failed to submit test attempt: ${error.message}`
      );
    }
  }

  async getUserAttempts(testId, userId, pagination = {}) {
    try {
      const { limit = 10, skip = 0, sort = '-attemptedAt' } = pagination;

      const attempts = await TestAttempt.find({ testId, userId })
        .sort(sort)
        .limit(limit)
        .skip(skip);

      const total = await TestAttempt.countDocuments({ testId, userId });

      return {
        data: attempts,
        pagination: {
          total,
          limit,
          skip,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new ServerError(
        `Failed to fetch user attempts: ${error.message}`
      );
    }
  }

  async getAttemptResult(testId, attemptId, userId) {
    try {
      const attempt = await TestAttempt.findOne({
        _id: attemptId,
        testId,
        userId,
      });

      if (!attempt) {
        throw new NotFoundError('Test attempt not found');
      }

      if (attempt.status === 'in_progress') {
        throw new ValidationError('Attempt is still in progress');
      }

      // Fetch questions for additional details
      const questions = await Question.find({ testId });

      const result = {
        attemptId: attempt._id,
        testId,
        userId,
        marksObtained: attempt.marksObtained,
        totalMarks: attempt.totalMarks,
        percentage:
          ((attempt.marksObtained / attempt.totalMarks) * 100).toFixed(2) + '%',
        status: attempt.status,
        attemptedAt: attempt.attemptedAt,
        completedAt: attempt.completedAt,
        answers: attempt.answers.map((ans) => {
          const question = questions.find(
            (q) => q._id.toString() === ans.questionId.toString()
          );
          return {
            questionId: ans.questionId,
            questionText: question?.questionText,
            userAnswer: ans.userAnswer,
            correctAnswer:
              question?.type === 'mcq'
                ? question.correctAnswer
                : 'Pending evaluation',
            isCorrect: ans.isCorrect,
            marksObtained: ans.marksObtained,
            marks: question?.marks,
          };
        }),
      };

      return result;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError)
        throw error;
      throw new ServerError(`Failed to fetch attempt result: ${error.message}`);
    }
  }

  async gradeDescriptiveAnswer(attemptId, questionId, marks, feedback) {
    try {
      const attempt = await TestAttempt.findById(attemptId);
      if (!attempt) {
        throw new NotFoundError('Test attempt not found');
      }

      // Find and update the answer
      const answerIndex = attempt.answers.findIndex(
        (a) => a.questionId.toString() === questionId
      );

      if (answerIndex === -1) {
        throw new NotFoundError('Answer not found');
      }

      const question = await Question.findById(questionId);
      if (!question) {
        throw new NotFoundError('Question not found');
      }

      attempt.answers[answerIndex].isCorrect = marks > 0;
      attempt.answers[answerIndex].marksObtained = marks;

      // Recalculate total marks
      attempt.marksObtained = attempt.answers.reduce(
        (sum, ans) => sum + (ans.marksObtained || 0),
        0
      );

      attempt.feedback = feedback;
      await attempt.save();

      logger.success(`Descriptive answer graded: ${questionId}`);
      return attempt;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new ServerError(`Failed to grade answer: ${error.message}`);
    }
  }
}

module.exports = new AttemptService();
