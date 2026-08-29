const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const protect = require('../middleware/auth');
const { publicLimiter, authedLimiter } = require('../middleware/rateLimiter');
const { validateCategoryInput, validateParamId } = require('../middleware/validator');
const { createSecureUploader, validateUploadedFileContent } = require('../middleware/uploadSecurity');

const upload = createSecureUploader(2 * 1024 * 1024);

router.get('/', publicLimiter, categoryController.getAllCategories);

// Guarded admin category operations
router.post('/', protect, authedLimiter, upload.single('image'), validateUploadedFileContent, validateCategoryInput(false), categoryController.createCategory);
router.put('/:id', protect, authedLimiter, validateParamId, upload.single('image'), validateUploadedFileContent, validateCategoryInput(true), categoryController.updateCategory);
router.delete('/:id', protect, authedLimiter, validateParamId, categoryController.deleteCategory);

module.exports = router;



