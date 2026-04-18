const express = require('express');
const { handleFileUpload } = require('../../middleware/fileUpload');
const FileController = require('../../controllers/admin/fileController');
const { auth } = require('../../middleware/auth');
const { roleCheck } = require('../../middleware/roleCheck');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(auth);
router.use(roleCheck('admin'));

/**
 * Module Management Routes
 */

// Create module with file upload and auto-generate content
router.post(
  '/',
  handleFileUpload,
  FileController.createModuleWithFile
);

// Get all modules with pagination and filtering
router.get('/', FileController.listModules);

// Get module statistics
router.get('/stats', FileController.getModuleStats);

// Get specific module with content
router.get('/:moduleId', FileController.getModuleWithContent);

// Update module
router.put('/:moduleId', FileController.updateModule);

// Delete module
router.delete('/:moduleId', FileController.deleteModule);

// Trigger content generation for existing module
router.post(
  '/:moduleId/generate-content',
  FileController.generateModuleContent
);

// Update module content manually
router.put(
  '/:moduleId/content',
  FileController.updateModuleContent
);

module.exports = router;
