const express = require('express');
const { auth } = require('../../middleware/auth');
const { roleCheck } = require('../../middleware/roleCheck');
const sprintPlanController = require('../../controllers/admin/sprintPlanController');

const router = express.Router();

// All sprint plan routes require authentication and admin role
router.use(auth);
router.use(roleCheck('admin'));

/**
 * Sprint Plan Management Routes
 */

// Create sprint plan
router.post('/', sprintPlanController.createSprintPlan);

// Get all sprint plans
router.get('/', sprintPlanController.getAllSprintPlans);

// Get sprint plan by ID
router.get('/:id', sprintPlanController.getSprintPlanById);

// Update sprint plan
router.put('/:id', sprintPlanController.updateSprintPlan);

// Delete sprint plan
router.delete('/:id', sprintPlanController.deleteSprintPlan);

module.exports = router;
