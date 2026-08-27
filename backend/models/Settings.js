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
  adminEmail: {
    type: String,
    required: true,
    default: "wasimkham7861@gmail.com"
  },
  adminPassword: {
    type: String,
    required: true,
    default: "wasim$$0786"
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', SettingsSchema);
