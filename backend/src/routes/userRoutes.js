const express = require('express');
const router = express.Router();
const { getProfileStats } = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/profile', getProfileStats);

module.exports = router;
