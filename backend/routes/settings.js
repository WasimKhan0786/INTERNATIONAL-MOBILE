const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const protect = require('../middleware/auth');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 } // 1MB limits for icons/logo
});

router.get('/', settingsController.getSettings);

// Guarded settings modifications supporting logo and favicon uploads
router.put('/', protect, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'favicon', maxCount: 1 }
]), settingsController.saveSettings);

module.exports = router;
