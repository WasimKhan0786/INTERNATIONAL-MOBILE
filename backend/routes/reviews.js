const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { publicLimiter } = require('../middleware/rateLimiter');
const { validateReviewInput } = require('../middleware/validator');

router.get('/', publicLimiter, reviewController.getAllReviews);
router.post('/', publicLimiter, validateReviewInput, reviewController.createReview);

module.exports = router;


