const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const protect = require('../middleware/auth');

// Public checkout submission
router.post('/', orderController.createOrder);

// Guarded admin order review list and details manager
router.get('/', protect, orderController.getAllOrders);
router.get('/:id', protect, orderController.getOrderById);
router.put('/:id/status', protect, orderController.updateOrderStatus);
router.put('/:id', protect, orderController.updateOrderDetails);
router.delete('/:id', protect, orderController.deleteOrder);

module.exports = router;
