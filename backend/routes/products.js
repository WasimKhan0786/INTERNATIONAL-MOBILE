const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const protect = require('../middleware/auth');
const multer = require('multer');

// Configure Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB per file
});

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Guarded Admin CRUD routes supporting multiple file uploads
router.post('/', protect, upload.array('images', 5), productController.createProduct);
router.put('/:id', protect, upload.array('images', 5), productController.updateProduct);
router.delete('/:id', protect, productController.deleteProduct);

module.exports = router;
