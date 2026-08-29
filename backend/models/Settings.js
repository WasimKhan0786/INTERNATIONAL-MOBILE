const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  shopName: {
    type: String,
    required: true,
    default: "INTERNATIONAL MOBILE"
  },
  tagline: {
    type: String,
    required: true,
    default: "सभी प्रकार के मोबाइल एवं एक्सेसरीज के थोक विक्रेता"
  },
  logo: {
    type: String,
    required: true,
    default: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80"
  },
  favicon: {
    type: String,
    required: true,
    default: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=32&auto=format&fit=crop&q=80"
  },
  phone: {
    type: String,
    required: true,
    default: "7654085663, 8789380072"
  },
  whatsapp: {
    type: String,
    required: true,
    default: "7654085663"
  },
  email: {
    type: String,
    required: true,
    default: "info@internationalmobile.com"
  },
  address: {
    type: String,
    required: true,
    default: "Prop. Hassan Siddiqui, Mob: 7654085663, 8789380072, Siwan, Bihar"
  },
  openingHours: {
    type: String,
    required: true,
    default: "Mon - Sat: 10:00 AM - 08:00 PM (Sunday Closed)"
  },
  socialInstagram: {
    type: String,
    default: ""
  },
  socialFacebook: {
    type: String,
    default: ""
  },
  socialYoutube: {
    type: String,
    default: ""
  },
  socialTelegram: {
    type: String,
    default: ""
  },
  deliveryCharge: {
    type: Number,
    required: true,
    default: 50
  },
  freeDeliveryThreshold: {
    type: Number,
    required: true,
    default: 499
  },
  currency: {
    type: String,
    required: true,
    default: "₹"
  },
  themeColor: {
    type: String,
    required: true,
    default: "#ff5722"
  },
  secondaryColor: {
    type: String,
    required: true,
    default: "#1e1e24"
  },
  storeStatus: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  },
  festivalModeActive: {
    type: Boolean,
    default: false
  },
  festivalTitle: {
    type: String,
    default: "🎉 Festive Mega Sale & Special Wholesale Offers!"
  },
  festivalSubtitle: {
    type: String,
    default: "Get up to 40% OFF on premium mobile covers, tempered glass, chargers & accessories!"
  },
  festivalDiscountBadge: {
    type: String,
    default: "FLAT 40% OFF"
  },
  festivalBannerBg: {
    type: String,
    default: "linear-gradient(135deg, #ff416c, #ff4b2b)"
  },
  flashSaleActive: {
    type: Boolean,
    default: false
  },
  flashSaleTitle: {
    type: String,
    default: "⚡ FLASH SALE - Limited Time Wholesale Deals!"
  },
  flashSaleSubtitle: {
    type: String,
    default: "Hurry! Massive discounts on top-selling accessories ending soon."
  },
  flashSaleEndTime: {
    type: String,
    default: ""
  },
  flashSaleDiscountBadge: {
    type: String,
    default: "UP TO 60% OFF"
  },
  spinWheelActive: {
    type: Boolean,
    default: false
  },
  spinWheelTitle: {
    type: String,
    default: "🎰 Spin & Win Exclusive Discounts!"
  },
  spinWheelSubtitle: {
    type: String,
    default: "Spin the lucky wheel to unlock special wholesale coupon codes!"
  },
  spinDifficulty: {
    type: String,
    enum: ['easy', 'normal', 'hard', 'always_lose'],
    default: 'normal'
  },
  customCoupons: {
    type: Array,
    default: [
      { code: 'FESTIVE10', discountType: 'percentage', discountValue: 10 },
      { code: 'FREESHIP', discountType: 'flat', discountValue: 50 },
      { code: 'MEGA15', discountType: 'percentage', discountValue: 15 },
      { code: 'FREEGIFT', discountType: 'flat', discountValue: 50 },
      { code: 'SUPER20', discountType: 'percentage', discountValue: 20 },
      { code: 'LUCKY5', discountType: 'percentage', discountValue: 5 }
    ]
  },
  adminAvatar: {
    type: String,
    default: ""
  },
  adminEmail: {
    type: String,
    required: true,
    default: process.env.ADMIN_EMAIL || "admin@techzone.com"
  },
  adminPassword: {
    type: String,
    required: true,
    default: process.env.ADMIN_PASSWORD || "admin123"
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', SettingsSchema);
