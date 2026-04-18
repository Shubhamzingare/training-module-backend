const publicService = require('../../services/public/publicService');

class PublicController {
  /**
   * GET /api/public/categories
   */
  async getCategories(req, res, next) {
    try {
      const categories = await publicService.getCategories();
      res.json({
        success: true,
        message: 'Categories retrieved',
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/public/modules/:id
   */
  async getModuleById(req, res, next) {
    try {
      const { id } = req.params;
      const module = await publicService.getModuleById(id);

      if (!module) {
        return res.status(404).json({
          success: false,
          message: 'Module not available or not active',
        });
      }

      res.json({
        success: true,
        message: 'Module retrieved',
        data: module,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/public/tests/:id
   */
  async getTestById(req, res, next) {
    try {
      const { id } = req.params;
      const test = await publicService.getTestById(id);

      if (!test) {
        return res.status(404).json({
          success: false,
          message: 'Test not available or not active',
        });
      }

      res.json({
        success: true,
        message: 'Test retrieved',
        data: test,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/public/modules/:id/content
   * Returns either module or test (whichever is active)
   */
  async getModuleContent(req, res, next) {
    try {
      const { id } = req.params;
      const content = await publicService.getModuleWithContent(id);

      res.json({
        success: true,
        message: 'Module content retrieved',
        data: content,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/public/tests/:id/start
   * Start a test session with team member info
   */
  async startTest(req, res, next) {
    try {
      const { id } = req.params;
      const { employeeId, name, email, departmentId, designation, shiftId, phone, totalQuestions } = req.body;

      // Validate required fields
      if (!employeeId || !name || !departmentId || !shiftId || !phone) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: employeeId, name, departmentId, shiftId, phone',
        });
      }

      const session = await publicService.startTestSession(id, {
        employeeId,
        name,
        email,
        departmentId,
        designation,
        shiftId,
        phone,
        totalQuestions,
      });

      res.json({
        success: true,
        message: 'Test session started',
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/public/sessions/:id/submit
   * Submit test answers and calculate score
   */
  async submitTest(req, res, next) {
    try {
      const { id } = req.params;
      const { answers, timeSpent } = req.body;

      const TestSession = require('../../models/TestSession');
      const Question = require('../../models/Question');

      const session = await TestSession.findById(id);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Test session not found',
        });
      }

      // Get test questions
      const questions = await Question.find({ testId: session.testId });

      // Calculate score
      let score = 0;
      let totalMarks = 0;

      for (const question of questions) {
        totalMarks += question.marks || 0;
        const userAnswer = answers[question._id];

        // For MCQ, check if answer is correct
        if (question.type === 'mcq' && userAnswer === question.correctAnswer) {
          score += question.marks || 0;
        }
        // For descriptive, we'd need manual grading - for now give full marks if answered
        else if (question.type === 'descriptive' && userAnswer) {
          score += question.marks || 0; // Manual grading needed
        }
      }

      // Get test info
      const test = await (require('../../models/Test')).findById(session.testId);
      const isPassed = score >= (test?.passingMarks || 0);

      // Update session
      session.answers = answers;
      session.score = score;
      session.totalMarks = totalMarks || test?.totalMarks || 100;
      session.isPassed = isPassed;
      session.status = 'completed';
      session.completedAt = new Date();

      await session.save();

      res.json({
        success: true,
        message: 'Test submitted successfully',
        data: {
          sessionId: session._id,
          score,
          totalMarks: session.totalMarks,
          isPassed,
          passingMarks: test?.passingMarks || 50,
          percentage: Math.round((score / session.totalMarks) * 100),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PublicController();
