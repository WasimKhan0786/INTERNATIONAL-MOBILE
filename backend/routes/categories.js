const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const protect = require('../middleware/auth');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }
});

router.get('/', categoryController.getAllCategories);

// Guarded admin category operations
router.post('/', protect, upload.single('image'), categoryController.createCategory);
router.put('/:id', protect, upload.single('image'), categoryController.updateCategory);
router.delete('/:id', protect, categoryController.deleteCategory);

module.exports = router;
