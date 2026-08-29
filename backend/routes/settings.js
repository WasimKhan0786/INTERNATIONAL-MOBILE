const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const protect = require('../middleware/auth');
const { publicLimiter, authedLimiter } = require('../middleware/rateLimiter');
const { validateSettingsInput } = require('../middleware/validator');
const { createSecureUploader, validateUploadedFileContent } = require('../middleware/uploadSecurity');

const upload = createSecureUploader(2 * 1024 * 1024);

router.get('/', publicLimiter, settingsController.getSettings);

// Guarded settings modifications supporting logo and favicon uploads with content validation
router.put('/', protect, authedLimiter, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'favicon', maxCount: 1 }
]), validateUploadedFileContent, validateSettingsInput, settingsController.saveSettings);

module.exports = router;



