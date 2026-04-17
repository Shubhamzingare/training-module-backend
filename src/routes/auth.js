const express = require('express');
const authController = require('../controllers/auth/authController');
const authenticate = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', (req, res, next) => authController.register(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));

// Protected routes
router.get('/me', authenticate, (req, res, next) => authController.getCurrentUser(req, res, next));
router.post('/logout', authenticate, (req, res, next) => authController.logout(req, res, next));

module.exports = router;
