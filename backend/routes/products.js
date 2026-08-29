const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const protect = require('../middleware/auth');
const { publicLimiter, authedLimiter } = require('../middleware/rateLimiter');
const { validateProductInput, validateBulkProductInput, validateParamId } = require('../middleware/validator');
const { createSecureUploader, validateUploadedFileContent } = require('../middleware/uploadSecurity');

// Secure Multer In-Memory Storage (Max 3MB per product image)
const upload = createSecureUploader(3 * 1024 * 1024);

router.get('/', publicLimiter, productController.getAllProducts);
router.post('/bulk', protect, authedLimiter, validateBulkProductInput, productController.bulkUploadProducts);
router.get('/:id', publicLimiter, validateParamId, productController.getProductById);

// Guarded Admin CRUD routes supporting multiple file uploads with magic byte content validation
router.post('/', protect, authedLimiter, upload.array('images', 5), validateUploadedFileContent, validateProductInput(false), productController.createProduct);
router.put('/:id', protect, authedLimiter, validateParamId, upload.array('images', 5), validateUploadedFileContent, validateProductInput(true), productController.updateProduct);
router.delete('/:id', protect, authedLimiter, validateParamId, productController.deleteProduct);

module.exports = router;



