const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const protect = require('../middleware/auth');
const { publicLimiter, authedLimiter } = require('../middleware/rateLimiter');
const { validateOrderInput, validateOrderStatusInput, validateParamId } = require('../middleware/validator');

// Public checkout submission
router.post('/', publicLimiter, validateOrderInput, orderController.createOrder);

// Guarded admin order review list and details manager
router.get('/', protect, authedLimiter, orderController.getAllOrders);
router.get('/:id', publicLimiter, validateParamId, orderController.getOrderById);
router.put('/:id/status', protect, authedLimiter, validateParamId, validateOrderStatusInput, orderController.updateOrderStatus);
router.put('/:id', protect, authedLimiter, validateParamId, validateOrderInput, orderController.updateOrderDetails);
router.delete('/:id', protect, authedLimiter, validateParamId, orderController.deleteOrder);

module.exports = router;


