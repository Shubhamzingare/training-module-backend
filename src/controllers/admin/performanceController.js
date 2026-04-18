const performanceService = require('../../services/admin/performanceService');

class PerformanceController {
  /**
   * GET /api/admin/performance/overview
   * Get summary statistics
   */
  async getOverview(req, res, next) {
    try {
      const overview = await performanceService.getPerformanceOverview();
      res.json({
        success: true,
        message: 'Performance overview retrieved',
        data: overview,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/performance/sessions
   * Get all active test sessions with optional filters
   */
  async getSessions(req, res, next) {
    try {
      const { testId, departmentId, status } = req.query;
      const filters = {};

      if (testId) filters.testId = testId;
      if (departmentId) filters.departmentId = departmentId;
      if (status) filters.status = status;

      // For active sessions specifically
      const sessions = await performanceService.getActiveSessions(filters);

      res.json({
        success: true,
        message: 'Active sessions retrieved',
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/performance/individual
   * Get individual performance data
   */
  async getIndividual(req, res, next) {
    try {
      const { name, email, employeeId } = req.query;
      const filters = {};

      if (name) filters.name = name;
      if (email) filters.email = email;
      if (employeeId) filters.employeeId = employeeId;

      const data = await performanceService.getIndividualPerformance(filters);

      res.json({
        success: true,
        message: 'Individual performance data retrieved',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/performance/departments
   * Get department-wise performance
   */
  async getDepartments(req, res, next) {
    try {
      const data = await performanceService.getDepartmentPerformance();

      res.json({
        success: true,
        message: 'Department performance data retrieved',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/performance/shifts
   * Get shift-wise performance
   */
  async getShifts(req, res, next) {
    try {
      const data = await performanceService.getShiftPerformance();

      res.json({
        success: true,
        message: 'Shift performance data retrieved',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/performance/all-sessions
   * Get all test sessions with advanced filters
   */
  async getAllSessions(req, res, next) {
    try {
      const { status, testId, departmentId, dateFrom, dateTo } = req.query;
      const filters = {};

      if (status) filters.status = status;
      if (testId) filters.testId = testId;
      if (departmentId) filters.departmentId = departmentId;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;

      const data = await performanceService.getAllSessions(filters);

      res.json({
        success: true,
        message: 'All sessions retrieved',
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PerformanceController();
