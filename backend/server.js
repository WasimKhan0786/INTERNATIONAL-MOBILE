const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { connectDB, ensureDbConnected } = require('./config/db');

// Load env configurations
dotenv.config();

const app = express();

// Express Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support larger base64 image uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mount Static Files
// Serve everything from the project root so both /frontend and /admin paths are accessible
app.use(express.static(path.join(__dirname, '../')));

// Redirect root URL to Customer Frontpage
app.get('/', (req, res) => {
  res.redirect('/frontend/index.html');
});

// Redirect /admin and /admin/ to Admin Login Page
app.get(['/admin', '/admin/'], (req, res) => {
  res.redirect('/admin/login.html');
});

// Dynamic Sitemap.xml Generator Route for Google Search Engine
const { generateSitemap } = require('./utils/generate-sitemap');
app.get(['/sitemap.xml', '/frontend/sitemap.xml'], async (req, res) => {
  try {
    const xml = await generateSitemap();
    res.header('Content-Type', 'text/xml');
    return res.status(200).send(xml);
  } catch (err) {
    console.error('Sitemap route error:', err);
    return res.status(500).send('Error generating sitemap XML');
  }
});

// Ensure DB is connected before processing any /api request
app.use('/api', ensureDbConnected);

// Mount Router Endpoints
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/banners', require('./routes/banners'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/reviews', require('./routes/reviews'));

// Global Error Handler (Prevents stack traces and file paths leakage)
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR HANDLER]', err.stack || err);
  res.status(err.status || 500).json({
    success: false,
    message: 'An unexpected server error occurred. Please try again later.'
  });
});

// MongoDB Connection & Startup
const PORT = process.env.PORT || 5000;

connectDB()
  .then(async () => {
    console.log('Connected to MongoDB Database successfully.');
    await autoSeedIfNeeded();
  })
  .catch(err => {
    console.error('Database connection startup failed:', err.message);
  });

// Only run app.listen locally (not on Vercel serverless environment)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running in real-time on port ${PORT}`);
    console.log(`Open Storefront: http://localhost:${PORT}/frontend/index.html`);
    console.log(`Open Admin Panel: http://localhost:${PORT}/admin/login.html`);
  });
}

module.exports = app;

// Safe Seeding on launch
async function autoSeedIfNeeded() {
  try {
    const User = require('./models/User');
    const Settings = require('./models/Settings');

    const targetAdminEmail = (process.env.ADMIN_EMAIL || 'admin@techzone.com').toLowerCase().trim();
    const targetAdminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // 1. Sync or create primary Admin account
    let adminUser = await User.findOne({ email: targetAdminEmail });

    if (!adminUser) {
      // Check if there is an old admin or any admin
      adminUser = await User.findOne({ email: 'admin@techzone.com' }) || await User.findOne({ role: 'admin' });
    }

    if (adminUser) {
      let isUpdated = false;
      if (adminUser.email !== targetAdminEmail) {
        console.log(`Updating admin email from ${adminUser.email} to ${targetAdminEmail}...`);
        adminUser.email = targetAdminEmail;
        isUpdated = true;
      }

      let passwordValid = false;
      try {
        passwordValid = await adminUser.comparePassword(targetAdminPassword);
      } catch (e) {
        passwordValid = false;
      }

      if (!passwordValid) {
        console.log(`Syncing admin password for ${targetAdminEmail}...`);
        adminUser.password = targetAdminPassword; // Model pre-save hook hashes password
        isUpdated = true;
      }

      if (isUpdated) {
        await adminUser.save();
        console.log('Admin user account synced successfully.');
      }
    } else {
      console.log(`No admin user found. Creating primary administrator: ${targetAdminEmail}...`);
      const newAdmin = new User({
        name: 'Administrator',
        email: targetAdminEmail,
        password: targetAdminPassword,
        role: 'admin'
      });
      await newAdmin.save();
      console.log(`Seeded admin user: ${targetAdminEmail}`);
    }

    let settings = await Settings.findOne();
    if (settings && (settings.adminEmail === 'admin@techzone.com' || settings.adminPassword === 'admin123')) {
      console.log('Found old credentials in settings. Updating configuration...');
      settings.adminEmail = targetAdminEmail;
      settings.adminPassword = targetAdminPassword;
      await settings.save();
      console.log('Settings configuration updated successfully.');
    }


    // Normal seeding if no admin exists at all
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      console.log('No admin found. Seeding default administrator...');
      const defaultAdmin = new User({
        name: 'Administrator',
        email: targetAdminEmail,
        password: targetAdminPassword, // Model pre-save hook hashes this
        role: 'admin'
      });
      await defaultAdmin.save();
      console.log(`Seeded admin: ${targetAdminEmail}`);
    }

    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      console.log('No settings configurations found. Seeding defaults...');
      const defaultSettings = new Settings();
      await defaultSettings.save();
      console.log('Seeded default settings configuration.');
    }

    // Auto-migrate settings if it's still using the old TechZone name
    settings = await Settings.findOne();
    if (settings && (settings.shopName === 'TechZone Mobile Accessories' || settings.shopName === 'TechZone' || settings.shopName === '')) {
      console.log('Migrating settings to INTERNATIONAL MOBILE...');
      settings.shopName = 'INTERNATIONAL MOBILE';
      settings.tagline = 'सभी प्रकार के मोबाइल एवं एक्सेसरीज के थोक विक्रेता';
      settings.phone = '7654085663, 8789380072';
      settings.whatsapp = '7654085663';
      settings.email = 'info@internationalmobile.com';
      settings.address = 'Prop. Hassan Siddiqui, Mob: 7654085663, 8789380072, Siwan, Bihar';
      settings.openingHours = 'Mon - Sat: 10:00 AM - 08:00 PM (Sunday Closed)';
      await settings.save();
      console.log('Settings migrated successfully to INTERNATIONAL MOBILE.');
    }

    const Banner = require('./models/Banner');
    const bannerCount = await Banner.countDocuments();
    const firstBanner = await Banner.findOne();
    const needsUpdate = bannerCount !== 6 || (firstBanner && firstBanner.title !== 'INTERNATIONAL MOBILE');

    if (needsUpdate) {
      console.log('Resetting / seeding default banners with 6 premium slides for INTERNATIONAL MOBILE...');
      await Banner.deleteMany();
      await Banner.insertMany([
        {
          title: 'INTERNATIONAL MOBILE',
          subtitle: 'सभी प्रकार के मोबाइल एवं एक्सेसरीज के थोक विक्रेता',
          buttonText: 'EXPLORE PRODUCTS',
          buttonUrl: 'shop.html',
          image: '/frontend/images/banner.jpeg',
          status: 'active',
          order: 1,
          discountBadge: 'Prop. Hassan Siddiqui'
        },
        {
          title: 'WIRELESS SPEAKER',
          subtitle: 'सभी ब्रांड के ब्लूटूथ स्पीकर्स और JBL साउंड सिस्टम थोक दाम पर',
          buttonText: 'EXPLORE PRODUCTS',
          buttonUrl: 'shop.html?category=speakers',
          image: '/frontend/images/hero.jpeg',
          status: 'active',
          order: 2,
          discountBadge: 'Mob: 7654085663'
        },
        {
          title: 'Smartphones / iPhones',
          subtitle: 'सभी ब्रांड्स के नए मोबाइल एवं आईफोन्स की पूरी रेंज उपलब्ध है',
          buttonText: 'EXPLORE PRODUCTS',
          buttonUrl: 'shop.html?category=smartphones',
          image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1600&auto=format&fit=crop&q=80',
          status: 'active',
          order: 3,
          discountBadge: 'All Brands Wholesaler'
        },
        {
          title: 'AirPods / TWS Earbuds',
          subtitle: 'बेहतरीन साउंड, एक्स्ट्रा बेस और कॉलिंग सपोर्ट वाले वायरलेस बड्स',
          buttonText: 'EXPLORE PRODUCTS',
          buttonUrl: 'shop.html?category=earphones',
          image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=1600&auto=format&fit=crop&q=80',
          status: 'active',
          order: 4,
          discountBadge: 'Latest Wearables'
        },
        {
          title: 'Smart Watch',
          subtitle: 'ब्लूटूथ कॉलिंग, हार्ट रेट मॉनिटर और फिट बॉडी ट्रैकर्स',
          buttonText: 'EXPLORE PRODUCTS',
          buttonUrl: 'shop.html?category=smart-watches',
          image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600&auto=format&fit=crop&q=80',
          status: 'active',
          order: 5,
          discountBadge: 'Trending Designs'
        },
        {
          title: 'Mobile Accessories',
          subtitle: 'ओरिजिनल कवर्स, 11D टेम्पर्ड ग्लास, केबल्स और फ़ास्ट चार्जिंग एडेप्टर',
          buttonText: 'EXPLORE PRODUCTS',
          buttonUrl: 'shop.html?category=accessories',
          image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=1600&auto=format&fit=crop&q=80',
          status: 'active',
          order: 6,
          discountBadge: 'Premium Quality'
        }
      ]);
      console.log('Seeded 6 brand-aligned image banners successfully.');
    }

    // Category migration for INTERNATIONAL MOBILE
    const Category = require('./models/Category');
    const categoryCount = await Category.countDocuments();
    const firstCategory = await Category.findOne();
    const needsCategoryUpdate = categoryCount === 0 || categoryCount === 8 || (firstCategory && firstCategory.slug === 'phone-covers');

    if (needsCategoryUpdate) {
      console.log('Resetting / seeding default categories for INTERNATIONAL MOBILE...');
      await Category.deleteMany();
      await Category.insertMany([
        {
          name: 'Smartphones',
          slug: 'smartphones',
          image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&auto=format&fit=crop&q=80',
          description: 'iPhones, Samsung, OnePlus, and other premium mobile brands',
          order: 1
        },
        {
          name: 'Accessories',
          slug: 'accessories',
          image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=300&auto=format&fit=crop&q=80',
          description: 'Premium shockproof covers, curved tempered glass, and fast chargers',
          order: 2
        },
        {
          name: 'Earphones',
          slug: 'earphones',
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80',
          description: 'Wired, neckbands, and true wireless stereo earbuds',
          order: 3
        },
        {
          name: 'Smart Watch',
          slug: 'smart-watches',
          image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80',
          description: 'Fitness trackers and Bluetooth calling wearables',
          order: 4
        },
        {
          name: 'Speakers',
          slug: 'speakers',
          image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&auto=format&fit=crop&q=80',
          description: 'Portable Bluetooth speakers and home theater systems',
          order: 5
        },
        {
          name: 'Power Bank',
          slug: 'power-banks',
          image: 'https://images.unsplash.com/photo-1609592424085-f5b252924190?w=300&auto=format&fit=crop&q=80',
          description: 'High capacity portable charging reserves',
          order: 6
        }
      ]);
      console.log('Seeded new categories successfully.');

      // Migrate existing products to the new categories!
      const Product = require('./models/Product');
      await Product.updateMany(
        { categorySlug: { $in: ['phone-covers', 'chargers', 'data-cables', 'tempered-glass'] } },
        { $set: { categorySlug: 'accessories' } }
      );
      await Product.updateMany(
        { categorySlug: 'tws' },
        { $set: { categorySlug: 'earphones' } }
      );
      console.log('Migrated existing product category relations successfully.');
    }
  } catch (err) {
    console.error('Error during auto-seeding:', err);
  }
}
