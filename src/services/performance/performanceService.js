const TestAttempt = require('../../models/TestAttempt');
const Test = require('../../models/Test');
const User = require('../../models/User');
const Batch = require('../../models/Batch');
const BatchMember = require('../../models/BatchMember');
const Module = require('../../models/Module');
const { ServerError } = require('../../utils/errorTypes');
const logger = require('../../utils/logger');

class PerformanceService {
  async getUserScores(filters = {}, pagination = {}) {
    try {
      const { userId, batchId } = filters;
      const { limit = 10, skip = 0, sort = '-attemptedAt' } = pagination;

      const query = { status: 'submitted' };
      if (userId) query.userId = userId;

      let userIds = null;
      if (batchId) {
        const batchMembers = await BatchMember.distinct('userId', {
          batchId,
        });
        userIds = batchMembers;
        query.userId = { $in: userIds };
      }

      const attempts = await TestAttempt.find(query)
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .populate('userId', 'name email department')
        .populate('testId', 'title')
        .lean();

      const total = await TestAttempt.countDocuments(query);

      // Calculate percentages
      const data = attempts.map((attempt) => ({
        ...attempt,
        percentage: (
          (attempt.marksObtained / attempt.totalMarks) *
          100
        ).toFixed(2),
      }));

      return {
        data,
        pagination: {
          total,
          limit,
          skip,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new ServerError(`Failed to fetch user scores: ${error.message}`);
    }
  }

  async getModuleScores(filters = {}, pagination = {}) {
    try {
      const { moduleId, batchId } = filters;
      const { limit = 10, skip = 0, sort = '-avgPercentage' } = pagination;

      // Get all tests for modules
      let testQuery = {};
      if (moduleId) {
        testQuery.moduleId = moduleId;
      }

      let tests = await Test.find(testQuery).lean();
      if (batchId) {
        // Filter tests for modules assigned to batch
        const batchModules = await BatchMember.distinct('moduleId', {
          batchId,
        });
        tests = tests.filter((t) =>
          batchModules.some((m) => m.toString() === t.moduleId.toString())
        );
      }

      const testIds = tests.map((t) => t._id);

      // Get performance for each test
      const performance = [];
      for (const testId of testIds) {
        const test = tests.find((t) => t._id.toString() === testId.toString());
        const attempts = await TestAttempt.find({
          testId,
          status: 'submitted',
        }).lean();

        if (attempts.length > 0) {
          const avgMarks =
            attempts.reduce((sum, a) => sum + a.marksObtained, 0) /
            attempts.length;
          const avgPercentage =
            (avgMarks / (attempts[0]?.totalMarks || 1)) * 100;

          performance.push({
            moduleId: test.moduleId,
            testId,
            testTitle: test.title,
            totalAttempts: attempts.length,
            averageMarks: avgMarks.toFixed(2),
            averagePercentage: avgPercentage.toFixed(2),
            highestScore: Math.max(
              ...attempts.map((a) => a.marksObtained)
            ),
            lowestScore: Math.min(
              ...attempts.map((a) => a.marksObtained)
            ),
          });
        }
      }

      // Sort and paginate
      const sorted = performance.sort((a, b) => {
        const aVal = parseFloat(a[sort.substring(1)]);
        const bVal = parseFloat(b[sort.substring(1)]);
        return sort.startsWith('-') ? bVal - aVal : aVal - bVal;
      });

      const paginated = sorted.slice(skip, skip + limit);

      return {
        data: paginated,
        pagination: {
          total: sorted.length,
          limit,
          skip,
          pages: Math.ceil(sorted.length / limit),
        },
      };
    } catch (error) {
      throw new ServerError(
        `Failed to fetch module scores: ${error.message}`
      );
    }
  }

  async getBatchScores(filters = {}, pagination = {}) {
    try {
      const { batchId } = filters;
      const { limit = 10, skip = 0 } = pagination;

      const query = batchId ? { _id: batchId } : {};
      const batches = await Batch.find(query).lean();

      const performance = [];

      for (const batch of batches) {
        const batchMembers = await BatchMember.distinct('userId', {
          batchId: batch._id,
        });

        const attempts = await TestAttempt.find({
          userId: { $in: batchMembers },
          status: 'submitted',
        }).lean();

        let avgPercentage = 0;
        if (attempts.length > 0) {
          const totalPercentage = attempts.reduce((sum, a) => {
            return sum + (a.marksObtained / a.totalMarks) * 100;
          }, 0);
          avgPercentage = (totalPercentage / attempts.length).toFixed(2);
        }

        performance.push({
          batchId: batch._id,
          batchName: batch.name,
          batchType: batch.type,
          totalMembers: batchMembers.length,
          totalAttempts: attempts.length,
          averagePercentage: avgPercentage,
          passCount: attempts.filter((a) => (a.marksObtained / a.totalMarks) * 100 >= 60).length,
          failCount: attempts.filter((a) => (a.marksObtained / a.totalMarks) * 100 < 60).length,
        });
      }

      const paginated = performance.slice(skip, skip + limit);

      return {
        data: paginated,
        pagination: {
          total: performance.length,
          limit,
          skip,
          pages: Math.ceil(performance.length / limit),
        },
      };
    } catch (error) {
      throw new ServerError(`Failed to fetch batch scores: ${error.message}`);
    }
  }

  async getUserProgress(userId) {
    try {
      const user = await User.findById(userId).lean();
      if (!user) {
        throw new Error('User not found');
      }

      // Get all attempts
      const attempts = await TestAttempt.find({
        userId,
        status: 'submitted',
      })
        .populate('testId', 'title moduleId')
        .lean();

      // Group by module
      const moduleProgress = {};
      let totalAttempts = 0;
      let totalMarksObtained = 0;
      let totalMarks = 0;

      for (const attempt of attempts) {
        const moduleId = attempt.testId?.moduleId?.toString();
        if (!moduleProgress[moduleId]) {
          moduleProgress[moduleId] = {
            testCount: 0,
            averagePercentage: 0,
            marksObtained: 0,
            totalMarks: 0,
          };
        }

        moduleProgress[moduleId].testCount += 1;
        moduleProgress[moduleId].marksObtained += attempt.marksObtained;
        moduleProgress[moduleId].totalMarks += attempt.totalMarks;

        totalAttempts += 1;
        totalMarksObtained += attempt.marksObtained;
        totalMarks += attempt.totalMarks;
      }

      // Calculate averages
      for (const moduleId in moduleProgress) {
        const progress = moduleProgress[moduleId];
        progress.averagePercentage = (
          (progress.marksObtained / progress.totalMarks) *
          100
        ).toFixed(2);
      }

      return {
        userId,
        userName: user.name,
        userEmail: user.email,
        totalTestsAttempted: totalAttempts,
        overallPercentage:
          totalMarks > 0
            ? ((totalMarksObtained / totalMarks) * 100).toFixed(2)
            : 0,
        overallMarks: `${totalMarksObtained}/${totalMarks}`,
        moduleProgress,
      };
    } catch (error) {
      throw new ServerError(
        `Failed to fetch user progress: ${error.message}`
      );
    }
  }

  async exportToCSV(filters = {}) {
    try {
      const query = { status: 'submitted' };
      if (filters.userId) query.userId = filters.userId;
      if (filters.batchId) {
        const batchMembers = await BatchMember.distinct('userId', {
          batchId: filters.batchId,
        });
        query.userId = { $in: batchMembers };
      }

      const attempts = await TestAttempt.find(query)
        .populate('userId', 'name email')
        .populate('testId', 'title')
        .lean();

      // Convert to CSV format
      let csv = 'User Name,Email,Test,Marks Obtained,Total Marks,Percentage,Attempted At\n';

      for (const attempt of attempts) {
        const percentage = (
          (attempt.marksObtained / attempt.totalMarks) *
          100
        ).toFixed(2);
        csv += `"${attempt.userId.name}","${attempt.userId.email}","${attempt.testId.title}",${attempt.marksObtained},${attempt.totalMarks},${percentage}%,"${attempt.attemptedAt}"\n`;
      }

      logger.success('Performance data exported to CSV');
      return csv;
    } catch (error) {
      throw new ServerError(
        `Failed to export performance data: ${error.message}`
      );
    }
  }
}

module.exports = new PerformanceService();
