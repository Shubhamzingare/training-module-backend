const express = require('express');
const { auth } = require('../../middleware/auth');

const router = express.Router();

router.use(auth);

// Stub: User module routes will be implemented later
router.get('/', (req, res) => {
  res.json({ message: 'User module routes - coming soon' });
});

module.exports = router;
