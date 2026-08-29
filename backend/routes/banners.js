const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const protect = require('../middleware/auth');
const { publicLimiter, authedLimiter } = require('../middleware/rateLimiter');
const { validateBannerInput, validateParamId } = require('../middleware/validator');
const { createSecureUploader, validateUploadedFileContent } = require('../middleware/uploadSecurity');

const upload = createSecureUploader(4 * 1024 * 1024);

router.get('/', publicLimiter, bannerController.getAllBanners);

// Guarded admin banner slide actions
router.post('/', protect, authedLimiter, upload.single('image'), validateUploadedFileContent, validateBannerInput(false), bannerController.createBanner);
router.put('/:id', protect, authedLimiter, validateParamId, upload.single('image'), validateUploadedFileContent, validateBannerInput(true), bannerController.updateBanner);
router.delete('/:id', protect, authedLimiter, validateParamId, bannerController.deleteBanner);

module.exports = router;



