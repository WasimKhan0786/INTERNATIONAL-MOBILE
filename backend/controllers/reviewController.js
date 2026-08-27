const Review = require('../models/Review');

exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving customer reviews'
    });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { name, rating, comment } = req.body;

    if (!name || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Name, rating and comment details are required.'
      });
    }

    const newReview = new Review({
      name,
      rating: Number(rating),
      comment
    });

    await newReview.save();

    return res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! Review posted.',
      review: newReview
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server error submitting customer review feedback'
    });
  }
};
