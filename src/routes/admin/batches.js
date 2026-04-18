const express = require('express');
const { auth } = require('../../middleware/auth');
const { roleCheck } = require('../../middleware/roleCheck');

const router = express.Router();

router.use(auth);
router.use(roleCheck('admin'));

// Stub: Batch management routes will be implemented later
router.get('/', (req, res) => {
  res.json({ message: 'Batch management routes - coming soon' });
});

module.exports = router;
