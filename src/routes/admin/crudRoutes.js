const express = require('express');
const adminAuth = require('../../middleware/adminAuth');
const { uploadSingleFile } = require('../../middleware/fileUpload');
const departmentController = require('../../controllers/admin/departmentController');
const shiftController = require('../../controllers/admin/shiftController');
const categoryController = require('../../controllers/admin/categoryController');
const topicController = require('../../controllers/admin/topicController');
const moduleAdminController = require('../../controllers/admin/moduleAdminController');
const testController = require('../../controllers/admin/testController');
const performanceController = require('../../controllers/admin/performanceController');
const statusToggleController = require('../../controllers/admin/statusToggleController');
const Question = require('../../models/Question');
const Module = require('../../models/Module');
const AdminLog = require('../../models/AdminLog');
const logger = require('../../utils/logger');

const router = express.Router();

// All routes require admin authentication
router.use(adminAuth);

/**
 * Admin CRUD Routes
 */

// Departments
router.post('/departments', departmentController.createDepartment);
router.get('/departments', departmentController.getAllDepartments);
router.put('/departments/:id', departmentController.updateDepartment);
router.delete('/departments/:id', departmentController.deleteDepartment);

// Shifts
router.post('/shifts', shiftController.createShift);
router.get('/shifts', shiftController.getAllShifts);
router.put('/shifts/:id', shiftController.updateShift);
router.delete('/shifts/:id', shiftController.deleteShift);

// Categories
router.post('/categories', categoryController.createCategory);
router.get('/categories', categoryController.getAllCategories);
router.get('/categories/:id', categoryController.getCategoryById);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// Topics
router.post('/topics', topicController.createTopic);
router.get('/topics', topicController.getAllTopics);
router.get('/topics/:id', topicController.getTopicById);
router.put('/topics/:id', topicController.updateTopic);
router.delete('/topics/:id', topicController.deleteTopic);

// Modules
router.post('/modules', uploadSingleFile, async (req, res, next) => {
  try {
    const { title, description, categoryId, topicId, fileType } = req.body;
    const VideoValidationService = require('../../services/file/videoValidationService');

    if (!title || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Title and categoryId are required',
      });
    }

    // Validate video duration if video file is uploaded
    if (req.file && fileType === 'video') {
      const videoValidation = await VideoValidationService.validateVideoDuration(
        req.file.path,
        fileType
      );

      if (!videoValidation.valid) {
        // Delete the uploaded file since it's invalid
        const FileService = require('../../services/file/fileService');
        await FileService.deleteFile(req.file.path).catch((err) => {
          logger.warn('Failed to delete invalid video file:', err.message);
        });

        return res.status(400).json({
          success: false,
          message: videoValidation.error,
        });
      }

      logger.info(videoValidation.message || 'Video duration validated');
    }

    let fileUrl = '';
    if (req.file) {
      // Create a file URL based on filename
      fileUrl = `/uploads/${req.file.filename}`;
    }

    const module = new Module({
      title,
      description: description || '',
      categoryId,
      topicId: topicId || null,
      fileUrl,
      fileType: fileType || 'pdf',
      status: 'draft',
      keyPoints: [],
      faqs: [],
      createdBy: req.admin.id,
    });

    await module.save();
    await module.populate('categoryId', 'name');
    await module.populate('topicId', 'name');
    await module.populate('createdBy', 'name email');

    logger.success(`Module created: ${title}`);

    // Log action
    await AdminLog.create({
      adminId: req.admin.id,
      action: 'create',
      resource: 'module',
      resourceId: module._id,
      ipAddress: req.ip,
    });

    // Generate content and tests if file was uploaded
    let testGenerationStarted = false;
    if (req.file && req.file.path) {
      try {
        logger.info(`Starting test generation for module: ${module._id}`);
        const ContentGeneratorService = require('../../services/module/contentGeneratorService');

        // Generate content and tests asynchronously (don't wait for it)
        ContentGeneratorService.generateAndSaveContent(
          module._id,
          req.file.path,
          fileType || 'pdf'
        ).then((result) => {
          logger.success(`Test generation completed for module: ${module._id}`);
          // Update module with generated key points and faqs
          if (result && result.moduleContent) {
            Module.findByIdAndUpdate(
              module._id,
              {
                keyPoints: result.moduleContent.keyPoints,
                faqs: result.moduleContent.faqs,
              }
            ).catch((err) => logger.error('Failed to update module with generated content:', err));
          }
        }).catch((error) => {
          logger.warn(`Test generation failed for module ${module._id}:`, error.message);
        });

        testGenerationStarted = true;
      } catch (error) {
        logger.warn('Could not start test generation:', error.message);
        // Don't fail the module creation if test generation fails
      }
    }

    res.status(201).json({
      success: true,
      message: testGenerationStarted
        ? 'Module created successfully! ✨ Tests are being generated automatically in the background.'
        : 'Module created successfully. Create tests manually in the Tests section.',
      data: module,
      testGenerationStarted,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/modules', moduleAdminController.getAllModules);
router.get('/modules/:id', moduleAdminController.getModuleById);
router.put('/modules/:id', moduleAdminController.updateModule);
router.delete('/modules/:id', moduleAdminController.deleteModule);
router.patch('/modules/:id/toggle-status', (req, res, next) => statusToggleController.toggleModuleStatus(req, res, next));

// Tests
router.post('/tests', testController.createTest);
router.get('/tests', testController.listTests);
router.get('/tests/:id', testController.getTest);
router.put('/tests/:id', testController.updateTest);
router.delete('/tests/:id', testController.deleteTest);
router.patch('/tests/:id/toggle-status', (req, res, next) => statusToggleController.toggleTestStatus(req, res, next));

// Questions
router.post('/tests/:id/questions', testController.addQuestion);
router.put('/tests/:testId/questions/:questionId', testController.updateQuestion);
router.put('/questions/:id', testController.updateQuestion);
router.delete('/tests/:testId/questions/:questionId', testController.deleteQuestion);
router.delete('/questions/:id', testController.deleteQuestion);
router.get('/questions', async (req, res) => {
  try {
    const { testId } = req.query;
    if (!testId) {
      return res.status(400).json({ success: false, message: 'testId query parameter is required' });
    }
    const questions = await Question.find({ testId }).sort({ order: 1 });
    res.status(200).json({
      success: true,
      message: 'Questions retrieved successfully',
      data: questions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Sections (for organizing questions into groups)
router.post('/tests/:testId/sections', (req, res, next) => testController.createSection(req, res, next));
router.get('/tests/:testId/sections', (req, res, next) => testController.getTestSections(req, res, next));
router.put('/sections/:sectionId', (req, res, next) => testController.updateSection(req, res, next));
router.delete('/sections/:sectionId', (req, res, next) => testController.deleteSection(req, res, next));

// Performance
router.get('/performance/overview', (req, res, next) => performanceController.getOverview(req, res, next));
router.get('/performance/individual', (req, res, next) => performanceController.getIndividual(req, res, next));
router.get('/performance/departments', (req, res, next) => performanceController.getDepartments(req, res, next));
router.get('/performance/shifts', (req, res, next) => performanceController.getShifts(req, res, next));
router.get('/performance/sessions', (req, res, next) => performanceController.getSessions(req, res, next));
router.get('/performance/all-sessions', (req, res, next) => performanceController.getAllSessions(req, res, next));

// router.get('/performance/export', (req, res) => {
//   res.json({ success: true, message: 'GET /api/admin/performance/export - TODO' });
// });

// router.get('/logs', (req, res) => {
//   res.json({ success: true, message: 'GET /api/admin/logs - TODO' });
// });

module.exports = router;
