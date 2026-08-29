const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const protect = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateAuthLogin } = require('../middleware/validator');

router.post('/login', authLimiter, validateAuthLogin, authController.login);
router.get('/me', protect, authController.getMe);
router.post('/logout', authController.logout);

module.exports = router;


