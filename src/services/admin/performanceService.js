const TestSession = require('../../models/TestSession');
const Test = require('../../models/Test');
const Department = require('../../models/Department');

class PerformanceService {
  /**
   * Get all active test sessions
   */
  async getActiveSessions(filters = {}) {
    try {
      const query = { status: 'in_progress' };

      // Filter by test name if provided
      if (filters.testId) {
        query.testId = filters.testId;
      }

      // Filter by department if provided
      if (filters.departmentId) {
        query.departmentId = filters.departmentId;
      }

      const sessions = await TestSession.find(query)
        .populate('testId', 'title timeLimit')
        .populate('departmentId', 'name')
        .populate('shiftId', 'name timeRange')
        .sort({ startedAt: -1 });

      // Enhance with calculated fields
      const enhancedSessions = sessions.map(session => {
        const now = new Date();
        const timeSpentMs = now - session.startedAt;
        const timeSpentSecs = Math.floor(timeSpentMs / 1000);
        const timeSpentMins = Math.floor(timeSpentMs / 60000);

        const timeLimit = session.testId?.timeLimit || 30;
        const remainingMins = Math.max(0, timeLimit - timeSpentMins);
        const remainingSecs = Math.floor((timeSpentMs % 60000) / 1000);

        return {
          id: session._id,
          userId: session.userId,
          userName: session.name,
          email: session.email || 'N/A',
          testName: session.testId?.title || 'Unknown Test',
          department: session.departmentId?.name || 'N/A',
          shift: session.shiftId?.timeRange || 'N/A',
          currentQuestion: session.currentQuestion || 0,
          totalQuestions: session.totalQuestions || 0,
          timeSpent: `${Math.floor(timeSpentSecs / 60)}:${(timeSpentSecs % 60).toString().padStart(2, '0')}`,
          timeRemaining: `${remainingMins}:${(60 - remainingSecs).toString().padStart(2, '0')}`,
          timeSpentSecs,
          status: remainingMins <= 0 ? 'completed' : 'in_progress',
          progressPercent: Math.min(100, (timeSpentSecs / (timeLimit * 60)) * 100),
        };
      });

      return enhancedSessions;
    } catch (error) {
      throw new Error(`Error fetching active sessions: ${error.message}`);
    }
  }

  /**
   * Get performance overview stats
   */
  async getPerformanceOverview() {
    try {
      const totalSessions = await TestSession.countDocuments();
      const completedSessions = await TestSession.countDocuments({ status: 'completed' });
      const activeSessions = await TestSession.countDocuments({ status: 'in_progress' });

      const passedSessions = await TestSession.countDocuments({
        status: 'completed',
        isPassed: true
      });

      const avgScore = await TestSession.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, avg: { $avg: '$score' } } },
      ]);

      return {
        totalSessions,
        activeSessions,
        completedSessions,
        passedSessions,
        passRate: completedSessions > 0 ? ((passedSessions / completedSessions) * 100).toFixed(2) : 0,
        averageScore: avgScore[0]?.avg?.toFixed(2) || 0,
      };
    } catch (error) {
      throw new Error(`Error fetching performance overview: ${error.message}`);
    }
  }

  /**
   * Get individual performance by name, email, or employee ID
   */
  async getIndividualPerformance(filters = {}) {
    try {
      const query = {};

      if (filters.name) {
        query.name = { $regex: filters.name, $options: 'i' };
      }
      if (filters.email) {
        query.email = { $regex: filters.email, $options: 'i' };
      }
      if (filters.employeeId) {
        query.employeeId = filters.employeeId;
      }

      const sessions = await TestSession.find(query)
        .populate('testId', 'title totalMarks passingMarks')
        .populate('departmentId', 'name')
        .populate('shiftId', 'name timeRange')
        .sort({ completedAt: -1 });

      return sessions.map(session => ({
        id: session._id,
        name: session.name,
        email: session.email,
        employeeId: session.employeeId,
        department: session.departmentId?.name || 'N/A',
        shift: session.shiftId?.timeRange || 'N/A',
        testName: session.testId?.title || 'Unknown Test',
        score: session.score,
        totalMarks: session.totalMarks,
        isPassed: session.isPassed,
        status: session.status,
        completedAt: session.completedAt,
        timeSpent: session.completedAt
          ? `${Math.floor((session.completedAt - session.startedAt) / 60000)} mins`
          : 'In Progress',
      }));
    } catch (error) {
      throw new Error(`Error fetching individual performance: ${error.message}`);
    }
  }

  /**
   * Get department-wise performance
   */
  async getDepartmentPerformance() {
    try {
      const result = await TestSession.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: '$departmentId',
            totalAttempts: { $sum: 1 },
            passedAttempts: {
              $sum: { $cond: ['$isPassed', 1, 0] },
            },
            averageScore: { $avg: '$score' },
          },
        },
        {
          $lookup: {
            from: 'departments',
            localField: '_id',
            foreignField: '_id',
            as: 'department',
          },
        },
        { $unwind: '$department' },
      ]);

      return result.map(item => ({
        department: item.department.name,
        totalAttempts: item.totalAttempts,
        passedAttempts: item.passedAttempts,
        passRate: ((item.passedAttempts / item.totalAttempts) * 100).toFixed(2),
        averageScore: item.averageScore.toFixed(2),
      }));
    } catch (error) {
      throw new Error(`Error fetching department performance: ${error.message}`);
    }
  }

  /**
   * Get shift-wise performance
   */
  async getShiftPerformance() {
    try {
      const result = await TestSession.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: '$shiftId',
            totalAttempts: { $sum: 1 },
            passedAttempts: {
              $sum: { $cond: ['$isPassed', 1, 0] },
            },
            averageScore: { $avg: '$score' },
          },
        },
        {
          $lookup: {
            from: 'shifts',
            localField: '_id',
            foreignField: '_id',
            as: 'shift',
          },
        },
        { $unwind: '$shift' },
      ]);

      return result.map(item => ({
        shift: item.shift.timeRange || item.shift.name,
        totalAttempts: item.totalAttempts,
        passedAttempts: item.passedAttempts,
        passRate: ((item.passedAttempts / item.totalAttempts) * 100).toFixed(2),
        averageScore: item.averageScore.toFixed(2),
      }));
    } catch (error) {
      throw new Error(`Error fetching shift performance: ${error.message}`);
    }
  }

  /**
   * Get all test sessions with optional filters
   */
  async getAllSessions(filters = {}) {
    try {
      const query = {};

      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.testId) {
        query.testId = filters.testId;
      }
      if (filters.departmentId) {
        query.departmentId = filters.departmentId;
      }
      if (filters.dateFrom || filters.dateTo) {
        query.completedAt = {};
        if (filters.dateFrom) {
          query.completedAt.$gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          query.completedAt.$lte = new Date(filters.dateTo);
        }
      }

      const sessions = await TestSession.find(query)
        .populate('testId', 'title totalMarks')
        .populate('departmentId', 'name')
        .populate('shiftId', 'timeRange')
        .sort({ completedAt: -1, startedAt: -1 })
        .limit(1000);

      return sessions.map(session => ({
        id: session._id,
        name: session.name,
        email: session.email,
        employeeId: session.employeeId,
        testName: session.testId?.title || 'Unknown Test',
        department: session.departmentId?.name || 'N/A',
        shift: session.shiftId?.timeRange || 'N/A',
        score: session.score,
        totalMarks: session.totalMarks,
        isPassed: session.isPassed,
        status: session.status,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
      }));
    } catch (error) {
      throw new Error(`Error fetching all sessions: ${error.message}`);
    }
  }
}

module.exports = new PerformanceService();
