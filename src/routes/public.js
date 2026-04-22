const express = require('express');
const Department = require('../models/Department');
const Shift = require('../models/Shift');
const publicController = require('../controllers/public/publicController');

const router = express.Router();

/**
 * Public API Routes (no authentication required)
 */

// Categories & Departments & Shifts
router.get('/categories', (req, res, next) => publicController.getCategories(req, res, next));

router.get('/departments', async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json({ success: true, message: 'Departments retrieved', data: departments });
  } catch (error) {
    next(error);
  }
});

router.get('/shifts', async (req, res, next) => {
  try {
    const shifts = await Shift.find().sort({ createdAt: 1 });
    res.json({ success: true, message: 'Shifts retrieved', data: shifts });
  } catch (error) {
    next(error);
  }
});

// Modules by category (public)
router.get('/categories/:categoryId/modules', async (req, res, next) => {
  try {
    const Module = require('../models/Module');
    const modules = await Module.find({
      categoryId: req.params.categoryId,
      status: 'active',
    }).select('title description fileType fileUrl keyPoints faqs').sort({ createdAt: -1 });
    res.json({ success: true, data: modules });
  } catch (error) { next(error); }
});

// Modules
router.get('/modules/:id', (req, res, next) => publicController.getModuleContent(req, res, next));

// List all active tests (public)
router.get('/tests', async (req, res, next) => {
  try {
    const Test = require('../models/Test');
    const tests = await Test.find({ status: 'active' }).sort({ createdAt: -1 });
    res.json({ success: true, data: tests });
  } catch (error) { next(error); }
});

// Get single test
router.get('/tests/:id', (req, res, next) => publicController.getTestById(req, res, next));

router.get('/tests/:id/questions', async (req, res, next) => {
  try {
    const Question = require('../models/Question');
    const questions = await Question.find({ testId: req.params.id }).sort({ order: 1 });
    res.json({ success: true, data: questions });
  } catch (error) { next(error); }
});

router.post('/tests/:id/start', (req, res, next) => publicController.startTest(req, res, next));

router.post('/sessions/:id/submit', (req, res, next) => publicController.submitTest(req, res, next));

module.exports = router;
