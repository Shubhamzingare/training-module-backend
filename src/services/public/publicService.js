const Module = require('../../models/Module');
const Test = require('../../models/Test');
const Category = require('../../models/Category');

class PublicService {
  /**
   * Get all active categories for public viewing
   */
  async getCategories() {
    try {
      const categories = await Category.find().sort({ type: 1, order: 1 });
      return categories;
    } catch (error) {
      throw new Error(`Error fetching categories: ${error.message}`);
    }
  }

  /**
   * Get module details by ID (only if active)
   * Returns module info including key points and FAQs
   */
  async getModuleById(moduleId) {
    try {
      const module = await Module.findById(moduleId)
        .populate('categoryId', 'name icon type')
        .populate('topicId', 'name')
        .populate('sprintPlanId', 'title startDate endDate');

      if (!module) {
        throw new Error('Module not found');
      }

      // Check if module is active
      if (module.status !== 'active') {
        return null; // Module not active, return null so test can be checked
      }

      return {
        id: module._id,
        title: module.title,
        description: module.description,
        status: module.status,
        keyPoints: module.keyPoints || [],
        faqs: module.faqs || [],
        fileUrl: module.fileUrl,
        fileType: module.fileType,
        category: module.categoryId,
        topic: module.topicId,
      };
    } catch (error) {
      throw new Error(`Error fetching module: ${error.message}`);
    }
  }

  /**
   * Get test details by ID (only if active)
   * Returns test info needed to start test
   */
  async getTestById(testId) {
    try {
      const test = await Test.findById(testId)
        .populate('moduleId', 'title description');

      if (!test) {
        throw new Error('Test not found');
      }

      // Check if test is active
      if (test.status !== 'active') {
        return null; // Test not active
      }

      return {
        id: test._id,
        title: test.title,
        description: test.description,
        status: test.status,
        totalMarks: test.totalMarks,
        passingMarks: test.passingMarks,
        timeLimit: test.timeLimit,
        moduleId: test.moduleId,
      };
    } catch (error) {
      throw new Error(`Error fetching test: ${error.message}`);
    }
  }

  /**
   * Get module with its associated test
   * Returns only the active one (either module or test)
   */
  async getModuleWithContent(moduleId) {
    try {
      const module = await Module.findById(moduleId)
        .populate('categoryId', 'name icon type')
        .populate('topicId', 'name');

      if (!module) {
        throw new Error('Module not found');
      }

      let activeContent = null;

      // Check if module is active
      if (module.status === 'active') {
        activeContent = {
          type: 'module',
          data: {
            id: module._id,
            title: module.title,
            description: module.description,
            status: module.status,
            keyPoints: module.keyPoints || [],
            faqs: module.faqs || [],
            fileUrl: module.fileUrl,
            fileType: module.fileType,
            category: module.categoryId,
            topic: module.topicId,
          },
        };
      } else {
        // If module not active, try to get associated test
        const test = await Test.findOne({ moduleId });

        if (test && test.status === 'active') {
          activeContent = {
            type: 'test',
            data: {
              id: test._id,
              title: test.title,
              description: test.description,
              status: test.status,
              totalMarks: test.totalMarks,
              passingMarks: test.passingMarks,
              timeLimit: test.timeLimit,
              moduleId: test.moduleId,
            },
          };
        } else {
          activeContent = {
            type: 'none',
            data: null,
          };
        }
      }

      return activeContent;
    } catch (error) {
      throw new Error(`Error fetching module content: ${error.message}`);
    }
  }

  /**
   * Start a test session
   * Creates a test session with user info
   */
  async startTestSession(testId, sessionData) {
    try {
      const TestSession = require('../../models/TestSession');

      // Get the test and module
      const test = await Test.findById(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      if (test.status !== 'active') {
        throw new Error('Test is not available');
      }

      // Create new test session
      const session = new TestSession({
        testId: test._id,
        moduleId: test.moduleId,
        employeeId: sessionData.employeeId,
        name: sessionData.name,
        email: sessionData.email,
        departmentId: sessionData.departmentId,
        designation: sessionData.designation,
        shiftId: sessionData.shiftId,
        phone: sessionData.phone,
        status: 'in_progress',
        totalQuestions: sessionData.totalQuestions || 0,
      });

      await session.save();

      return {
        sessionId: session._id,
        testId: test._id,
        title: test.title,
        timeLimit: test.timeLimit,
        totalMarks: test.totalMarks,
        message: 'Test session started',
      };
    } catch (error) {
      throw new Error(`Error starting test session: ${error.message}`);
    }
  }
}

module.exports = new PublicService();
