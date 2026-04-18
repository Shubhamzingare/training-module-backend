const express = require('express');
const { auth } = require('../../middleware/auth');
const { roleCheck } = require('../../middleware/roleCheck');
const categoryController = require('../../controllers/admin/categoryController');

const router = express.Router();

// All category routes require authentication and admin role
router.use(auth);
router.use(roleCheck('admin'));

/**
 * Category Management Routes
 */

// Create category
router.post('/', categoryController.createCategory);

// Get all categories
router.get('/', categoryController.getAllCategories);

// Get category by ID
router.get('/:id', categoryController.getCategoryById);

// Update category
router.put('/:id', categoryController.updateCategory);

// Delete category
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
