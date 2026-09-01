const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  public_id: {
    type: String,
    required: true
  }
}, { _id: false });

const SpecificationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  }
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false,
    default: ''
  },
  categorySlug: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  sku: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    trim: true
  },
  price: {
    type: Number,
    required: false,
    default: 0,
    min: 0
  },
  discountPrice: {
    type: Number,
    default: null,
    min: 0
  },
  pricePerPiece: {
    type: Number,
    default: null,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  images: [ImageSchema],
  specifications: [SpecificationSchema],
  tags: [String],
  featured: {
    type: Boolean,
    default: false
  },
  bestseller: {
    type: Boolean,
    default: false
  },
  newArrival: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  rating: {
    type: Number,
    default: 4.5
  },
  reviewsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index search fields for text queries
ProductSchema.index({ name: 'text', brand: 'text', tags: 'text', sku: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
