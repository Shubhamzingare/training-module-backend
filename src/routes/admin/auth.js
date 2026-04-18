const express = require('express');
const adminAuthController = require('../../controllers/admin/adminAuthController');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();

/**
 * Admin Authentication Routes
 */

// Public routes
router.post('/login', adminAuthController.login);

// Protected routes (require admin auth)
router.post('/logout', adminAuth, adminAuthController.logout);
router.get('/me', adminAuth, adminAuthController.getMe);

// Super admin only - create new admin
router.post('/create-admin', adminAuth, adminAuthController.createAdmin);

module.exports = router;
