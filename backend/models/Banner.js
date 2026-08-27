const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    required: true
  },
  buttonText: {
    type: String,
    default: 'Shop Now'
  },
  buttonUrl: {
    type: String,
    default: 'shop.html'
  },
  image: {
    type: String,
    required: true
  },
  discountBadge: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  order: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Banner', BannerSchema);
