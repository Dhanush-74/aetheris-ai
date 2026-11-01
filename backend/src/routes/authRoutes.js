const express = require('express');
const router = express.Router();
const { register, login, demoLogin, getMe, updatePreferences } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

router.post('/register', apiLimiter, register);
router.post('/login', apiLimiter, login);
router.post('/demo', apiLimiter, demoLogin);
router.get('/me', authenticate, getMe);
router.put('/preferences', authenticate, updatePreferences);

module.exports = router;
