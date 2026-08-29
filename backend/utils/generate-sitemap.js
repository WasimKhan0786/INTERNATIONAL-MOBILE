const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { connectDB } = require('../config/db');

// Models
const Product = require('../models/Product');
const Category = require('../models/Category');

dotenv.config();

/**
 * Generates an XML Sitemap conforming to Google Sitemap XML Standards
 */
async function generateSitemap() {
  console.log('🚀 Starting Sitemap.xml Generation...');

  // Ensure DB connection
  await connectDB();

  const baseUrl = (process.env.SITE_URL || 'https://internationalmobile.xyz').replace(/\/$/, '');
  const today = new Date().toISOString().slice(0, 10);

  // 1. Static Pages Definition
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily', lastmod: today },
    { url: '/frontend/index.html', priority: '1.0', changefreq: 'daily', lastmod: today },
    { url: '/frontend/shop.html', priority: '0.9', changefreq: 'daily', lastmod: today },
    { url: '/frontend/categories.html', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { url: '/frontend/cart.html', priority: '0.5', changefreq: 'weekly', lastmod: today },
    { url: '/frontend/checkout.html', priority: '0.5', changefreq: 'weekly', lastmod: today },
    { url: '/frontend/contact.html', priority: '0.6', changefreq: 'monthly', lastmod: today }
  ];

  // 2. Fetch Active Categories from Database
  const categories = await Category.find({ status: 'active' }).select('slug updatedAt').lean();
  const categoryUrls = categories.map(cat => ({
    url: `/frontend/shop.html?category=${cat.slug}`,
    priority: '0.8',
    changefreq: 'weekly',
    lastmod: cat.updatedAt ? new Date(cat.updatedAt).toISOString().slice(0, 10) : today
  }));

  // 3. Fetch Active Products from Database
  const products = await Product.find({ status: 'active' }).select('_id updatedAt').lean();
  const productUrls = products.map(prod => ({
    url: `/frontend/product-details.html?id=${prod._id}`,
    priority: '0.8',
    changefreq: 'daily',
    lastmod: prod.updatedAt ? new Date(prod.updatedAt).toISOString().slice(0, 10) : today
  }));

  // Combine all entries
  const allUrls = [...staticPages, ...categoryUrls, ...productUrls];

  // Build XML String
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  allUrls.forEach(item => {
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}${item.url}</loc>\n`;
    xml += `    <lastmod>${item.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
    xml += `    <priority>${item.priority}</priority>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>\n';

  // Save sitemap.xml to root and frontend directories
  const rootSitemapPath = path.join(__dirname, '../../sitemap.xml');
  const frontendSitemapPath = path.join(__dirname, '../../frontend/sitemap.xml');

  fs.writeFileSync(rootSitemapPath, xml, 'utf8');
  fs.writeFileSync(frontendSitemapPath, xml, 'utf8');

  console.log(`✅ Sitemap successfully generated with ${allUrls.length} total URLs!`);
  console.log(`📄 Saved to Root: ${rootSitemapPath}`);
  console.log(`📄 Saved to Frontend: ${frontendSitemapPath}`);

  return xml;
}

// Allow direct CLI invocation
if (require.main === module) {
  generateSitemap()
    .then(() => {
      console.log('🎉 Sitemap generation complete!');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Sitemap generation error:', err);
      process.exit(1);
    });
}

module.exports = { generateSitemap };
