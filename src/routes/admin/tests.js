const express = require('express');
const { auth } = require('../../middleware/auth');
const { roleCheck } = require('../../middleware/roleCheck');

const router = express.Router();

router.use(auth);
router.use(roleCheck('admin'));

// Stub: Test management routes will be implemented later
router.get('/', (req, res) => {
  res.json({ message: 'Test management routes - coming soon' });
});

module.exports = router;
