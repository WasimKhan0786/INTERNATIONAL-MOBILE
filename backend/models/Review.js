const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  date: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Review', ReviewSchema);
