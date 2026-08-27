const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const protect = require('../middleware/auth');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 } // 3MB slide uploads
});

router.get('/', bannerController.getAllBanners);

// Guarded admin banner slide actions
router.post('/', protect, upload.single('image'), bannerController.createBanner);
router.put('/:id', protect, upload.single('image'), bannerController.updateBanner);
router.delete('/:id', protect, bannerController.deleteBanner);

module.exports = router;
