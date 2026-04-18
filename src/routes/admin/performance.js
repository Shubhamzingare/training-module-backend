const express = require('express');
const { auth } = require('../../middleware/auth');
const { roleCheck } = require('../../middleware/roleCheck');
const performanceController = require('../../controllers/admin/performanceController');

const router = express.Router();

router.use(auth);
router.use(roleCheck('admin'));

/**
 * GET /api/admin/performance/overview
 * Get summary statistics for performance dashboard
 */
router.get('/overview', performanceController.getOverview.bind(performanceController));

/**
 * GET /api/admin/performance/sessions
 * Get all active test sessions with optional filters
 * Query params: testId, departmentId, status
 */
router.get('/sessions', performanceController.getSessions.bind(performanceController));

/**
 * GET /api/admin/performance/individual
 * Get individual performance data
 * Query params: name, email, employeeId
 */
router.get('/individual', performanceController.getIndividual.bind(performanceController));

/**
 * GET /api/admin/performance/departments
 * Get department-wise performance analytics
 */
router.get('/departments', performanceController.getDepartments.bind(performanceController));

/**
 * GET /api/admin/performance/shifts
 * Get shift-wise performance analytics
 */
router.get('/shifts', performanceController.getShifts.bind(performanceController));

/**
 * GET /api/admin/performance/all-sessions
 * Get all test sessions with advanced filters
 * Query params: status, testId, departmentId, dateFrom, dateTo
 */
router.get('/all-sessions', performanceController.getAllSessions.bind(performanceController));

module.exports = router;
