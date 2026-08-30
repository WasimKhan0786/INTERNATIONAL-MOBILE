const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Import Models
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Banner = require('../models/Banner');
const Settings = require('../models/Settings');
const Review = require('../models/Review');

dotenv.config();

const DEFAULT_SETTINGS = {
  shopName: "INTERNATIONAL MOBILE",
  tagline: "सभी प्रकार के मोबाइल एवं एक्सेसरीज के थोक विक्रेता",
  logo: "images/logo.png",
  favicon: "images/favicon.png",
  phone: "7654085663, 8789380072",
  whatsapp: "7654085663",
  email: "info@internationalmobile.com",
  address: "Prop. Hassan Siddiqui, Mob: 7654085663, 8789380072, Siwan, Bihar",
  openingHours: "Mon - Sat: 10:00 AM - 08:00 PM (Sunday Closed)",
  socialInstagram: "https://instagram.com",
  socialFacebook: "https://facebook.com",
  socialYoutube: "https://youtube.com",
  socialTelegram: "https://t.me",
  deliveryCharge: 50,
  freeDeliveryThreshold: 499,
  currency: "₹",
  themeColor: "#ff5722",
  secondaryColor: "#1e1e24",
  adminEmail: process.env.ADMIN_EMAIL || "admin@techzone.com",
  adminPassword: process.env.ADMIN_PASSWORD || "admin123"
};

const DEFAULT_CATEGORIES = [
  { name: 'Smartphones', slug: 'smartphones', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&auto=format&fit=crop&q=80', description: 'iPhones, Samsung, OnePlus, and other premium mobile brands', order: 1 },
  { name: 'Accessories', slug: 'accessories', image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=300&auto=format&fit=crop&q=80', description: 'Premium shockproof covers, curved tempered glass, and fast chargers', order: 2 },
  { name: 'Earphones', slug: 'earphones', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80', description: 'Wired, neckbands, and true wireless stereo earbuds', order: 3 },
  { name: 'Smart Watch', slug: 'smart-watches', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80', description: 'Fitness trackers and Bluetooth calling wearables', order: 4 },
  { name: 'Speakers', slug: 'speakers', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&auto=format&fit=crop&q=80', description: 'Portable Bluetooth speakers and home theater systems', order: 5 },
  { name: 'Power Bank', slug: 'power-banks', image: 'https://images.unsplash.com/photo-1609592424085-f5b252924190?w=300&auto=format&fit=crop&q=80', description: 'High capacity portable charging reserves', order: 6 }
];

const DEFAULT_PRODUCTS = [
  {
    name: 'SuperVOOC 65W Fast Charger',
    description: 'High-speed fast charging adapter matching VOOC, SuperVOOC, Quick Charge and PD standards. Built with multi-layer smart chip security protection preventing device overheating and voltage surges. Sleek pocket design.',
    categorySlug: 'chargers',
    brand: 'OnePlus',
    sku: 'CHG-SV65-OP',
    price: 1999,
    discountPrice: 1299,
    stock: 45,
    images: [{ url: 'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=600&auto=format&fit=crop&q=80', public_id: 'seed_prod_1' }],
    specifications: [
      { name: 'Output Power', value: '65W Max' },
      { name: 'Port Type', value: 'USB-A to Type-C' },
      { name: 'Technology', value: 'SuperVOOC / Warp Charge' },
      { name: 'Warranty', value: '6 Months Brand Warranty' }
    ],
    tags: ['fast charger', 'vooc charger', 'oneplus charger', '65w adapter'],
    featured: true,
    bestseller: true,
    newArrival: false,
    rating: 4.8,
    reviewsCount: 124
  },
  {
    name: 'iPhone 15 Frosted Matte Case',
    description: 'Ultra-thin translucent frosted protective cover with soft TPU bumper guards. Drop tested shockproof corners safeguard phone lens and glass back. Anti-fingerprint matte texture feels premium in hands.',
    categorySlug: 'phone-covers',
    brand: 'Spigen',
    sku: 'COV-IP15M-SP',
    price: 1299,
    discountPrice: 699,
    stock: 120,
    images: [{ url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&auto=format&fit=crop&q=80', public_id: 'seed_prod_2' }],
    specifications: [
      { name: 'Material', value: 'Polycarbonate & TPU' },
      { name: 'Compatibility', value: 'iPhone 15 Pro & Pro Max' },
      { name: 'Thickness', value: '1.2 mm slim' },
      { name: 'Design', value: 'Frosted Translucent Back' }
    ],
    tags: ['iphone 15 cover', 'spigen case', 'frosted cover', 'shockproof case'],
    featured: true,
    bestseller: false,
    newArrival: true,
    rating: 4.6,
    reviewsCount: 95
  },
  {
    name: 'Samsung S24 Ultra Liquid Silicone Cover',
    description: 'Silky-smooth soft liquid silicone cover protecting against drops and dirt. Inner micro-fiber lining cushions the premium glass body. Easy-to-clean design supports wireless charging docks directly.',
    categorySlug: 'phone-covers',
    brand: 'Samsung',
    sku: 'COV-S24US-SM',
    price: 1499,
    discountPrice: 899,
    stock: 75,
    images: [{ url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80', public_id: 'seed_prod_3' }],
    specifications: [
      { name: 'Material', value: 'Liquid Silicone' },
      { name: 'Compatibility', value: 'Samsung Galaxy S24 Ultra' },
      { name: 'Inside Lining', value: 'Microfiber Cushion' },
      { name: 'Wireless Charging', value: 'Fully Compatible' }
    ],
    tags: ['s24 ultra cover', 'silicone case', 'samsung original case', 'soft cover'],
    featured: false,
    bestseller: true,
    newArrival: false,
    rating: 4.5,
    reviewsCount: 68
  },
  {
    name: '11D Curved Tempered Glass Guard',
    description: 'High definition 9H hardness tempered glass with 11D curved edge reinforcement. Complete edge-to-edge screen overlay protects against impact fractures. Oleophobic coating keeps fingerprints and oils away.',
    categorySlug: 'tempered-glass',
    brand: 'Gorilla Guard',
    sku: 'GLS-11DCV-GG',
    price: 399,
    discountPrice: 199,
    stock: 350,
    images: [{ url: 'https://images.unsplash.com/photo-1605152276897-4f618f831968?w=600&auto=format&fit=crop&q=80', public_id: 'seed_prod_4' }],
    specifications: [
      { name: 'Hardness', value: '9H Tempered Glass' },
      { name: 'Edge Cut', value: '11D Curved Edge' },
      { name: 'Thickness', value: '0.33 mm' },
      { name: 'Features', value: 'Bubble-free adhesive, HD clarity' }
    ],
    tags: ['tempered glass', 'screen protector', '11d glass', 'scratch guard'],
    featured: false,
    bestseller: false,
    newArrival: false,
    rating: 4.3,
    reviewsCount: 210
  },
  {
    name: 'Braided Type-C to Type-C 100W PD Cable',
    description: 'Heavy duty nylon braided charging cable supporting Power Delivery up to 100W. Supports ultra-fast data transfer speeds up to 480Mbps. Re-enforced connectors prevent breakage at joints. 2 meters length for easy usage.',
    categorySlug: 'data-cables',
    brand: 'Anker',
    sku: 'CBL-CC100-AN',
    price: 999,
    discountPrice: 599,
    stock: 80,
    images: [{ url: 'https://images.unsplash.com/photo-1585143004381-807d4b4a9235?w=600&auto=format&fit=crop&q=80', public_id: 'seed_prod_5' }],
    specifications: [
      { name: 'Max Power', value: '100W PD' },
      { name: 'Length', value: '2 Meters' },
      { name: 'Material', value: 'Braided Nylon' },
      { name: 'Transfer Speed', value: '480 Mbps' }
    ],
    tags: ['c type cable', 'fast charging cable', 'anker cable', '100w pd'],
    featured: true,
    bestseller: true,
    newArrival: false,
    rating: 4.9,
    reviewsCount: 154
  },
  {
    name: 'Realme Buds Wireless 3 Neckband',
    description: '30dB Active Noise Cancellation neckband with 13.6mm dynamic bass drivers. Up to 40 hours total battery life with fast charging support. IP55 dust and water resistant, dual device fast pairing support.',
    categorySlug: 'earphones',
    brand: 'Realme',
    sku: 'EAR-RW3-RM',
    price: 2499,
    discountPrice: 1799,
    stock: 25,
    images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80', public_id: 'seed_prod_6' }],
    specifications: [
      { name: 'Driver Size', value: '13.6mm Bass Driver' },
      { name: 'Battery Life', value: 'Up to 40 Hours' },
      { name: 'Water Resistance', value: 'IP55' },
      { name: 'Bluetooth Version', value: '5.3' }
    ],
    tags: ['neckband', 'wireless earphones', 'realme buds', 'anc'],
    featured: true,
    bestseller: false,
    newArrival: true,
    rating: 4.4,
    reviewsCount: 75
  },
  {
    name: 'Boat Airdopes 141 TWS Earbuds',
    description: 'True wireless earbuds with 42 hours playback, ENx Tech for clear voice calls. Beast Mode low latency for gaming. IPX4 sweat shield, ASAP fast charge gives 75 mins in 5 mins charging.',
    categorySlug: 'tws',
    brand: 'boAt',
    sku: 'TWS-AD141-BT',
    price: 4490,
    discountPrice: 1299,
    stock: 50,
    images: [{ url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80', public_id: 'seed_prod_7' }],
    specifications: [
      { name: 'Playback Time', value: 'Up to 42 Hours' },
      { name: 'Driver', value: '8mm x 2' },
      { name: 'Low Latency', value: '80ms (Beast Mode)' },
      { name: 'Bluetooth', value: 'v5.1' }
    ],
    tags: ['tws', 'boat airdopes', 'earbuds', 'wireless earbuds'],
    featured: true,
    bestseller: true,
    newArrival: false,
    rating: 4.2,
    reviewsCount: 310
  },
  {
    name: '20000mAh 22.5W Power Bank',
    description: 'Compact power bank with triple output port configurations (2 USB-A + 1 Type-C). Supports 22.5W two-way fast charging. Smart power distribution ensures safe charging of multiple devices simultaneously.',
    categorySlug: 'power-banks',
    brand: 'Mi India',
    sku: 'PBK-MI20K-MI',
    price: 2199,
    discountPrice: 1599,
    stock: 18,
    images: [{ url: 'https://images.unsplash.com/photo-1609592424085-f5b252924190?w=600&auto=format&fit=crop&q=80', public_id: 'seed_prod_8' }],
    specifications: [
      { name: 'Capacity', value: '20000 mAh' },
      { name: 'Charging Speed', value: '22.5W Fast Charging' },
      { name: 'Ports', value: '1 Type-C (Input/Output) + 2 USB-A (Output)' },
      { name: 'Weight', value: '430g' }
    ],
    tags: ['power bank', 'mi power bank', '20000mah', 'portable charger'],
    featured: false,
    bestseller: false,
    newArrival: true,
    rating: 4.7,
    reviewsCount: 92
  },
  {
    name: 'Noise ColorFit Pulse 3 Smartwatch',
    description: '1.96-inch HD display smart wearable with Bluetooth calling. Monitor heart rate, SpO2, sleep cycle tracker. 100+ sports modes, customizable cloud watch faces. IP68 waterproof rating.',
    categorySlug: 'smart-watches',
    brand: 'Noise',
    sku: 'WTC-NCP3-NS',
    price: 4999,
    discountPrice: 1899,
    stock: 15,
    images: [{ url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80', public_id: 'seed_prod_9' }],
    specifications: [
      { name: 'Display', value: '1.96" TFT LCD Display' },
      { name: 'Calling', value: 'Bluetooth Call Support' },
      { name: 'Battery Life', value: 'Up to 7 Days' },
      { name: 'Sensors', value: 'HR, SpO2, Accelerometer' }
    ],
    tags: ['smart watch', 'noise watch', 'fitness tracker', 'calling watch'],
    featured: true,
    bestseller: true,
    newArrival: true,
    rating: 4.5,
    reviewsCount: 140
  },
  {
    name: 'Stone 350 Portable Bluetooth Speaker',
    description: '10W RMS stereo speaker with 12 hours playtime, IPX7 splash resistance. Rugged cylinder design, dual-connectivity options via Bluetooth v5.0 and AUX ports. Excellent acoustics for indoor & outdoor parties.',
    categorySlug: 'speakers',
    brand: 'boAt',
    sku: 'SPK-BST350-BT',
    price: 3499,
    discountPrice: 1599,
    stock: 5,
    images: [{ url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80', public_id: 'seed_prod_10' }],
    specifications: [
      { name: 'Sound Output', value: '10W RMS' },
      { name: 'Playtime', value: 'Up to 12 Hours' },
      { name: 'Waterproof Rating', value: 'IPX7 Splash Shield' },
      { name: 'Drivers', value: '1.96" Dynamic Driver' }
    ],
    tags: ['bluetooth speaker', 'boat speaker', 'wireless speaker', 'portable speaker'],
    featured: false,
    bestseller: false,
    newArrival: true,
    rating: 4.3,
    reviewsCount: 64
  }
];

const DEFAULT_BANNERS = [
  {
    title: 'Premium Mobile Accessories',
    subtitle: 'Elevate your smartphone style with tough shockproof drop protection',
    buttonText: 'Shop Now',
    buttonUrl: 'shop.html',
    image: '/frontend/images/banner.jpeg',
    status: 'active',
    order: 1,
    discountBadge: 'Flat 50% Off'
  },
  {
    title: 'High Speed Fast Charging',
    subtitle: 'Power up faster with top brand chargers, PD plugs & braided Type-C cords',
    buttonText: 'Explore Chargers',
    buttonUrl: 'shop.html?category=chargers',
    image: '/frontend/images/hero.jpeg',
    status: 'active',
    order: 2,
    discountBadge: 'Extra 10% Off'
  }
];

const DEFAULT_REVIEWS = [
  { name: "Rohit Sharma", rating: 5, comment: "Awesome products! The SuperVOOC 65W charger works exactly like the original. Highly recommended!" },
  { name: "Ananya Sen", rating: 5, comment: "Spigen phone case is gorgeous and protects the screen corners very well. Quick delivery in CP." },
  { name: "Vikram Malhotra", rating: 4, comment: "Quality is top notch. Prices are cheaper than other stores. Clean service, happy with boAt earbuds." }
];

const DEFAULT_ORDERS = [
  {
    orderNumber: 'ORD-20260827-0001',
    customerName: 'Aman Varma',
    mobile: '9812345678',
    email: 'aman@example.com',
    products: [
      { id: 'prod-1', name: 'SuperVOOC 65W Fast Charger', brand: 'OnePlus', price: 1299, quantity: 1, image: 'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=600&auto=format&fit=crop&q=80', sku: 'CHG-SV65-OP' },
      { id: 'prod-4', name: '11D Curved Tempered Glass Guard', brand: 'Gorilla Guard', price: 199, quantity: 2, image: 'https://images.unsplash.com/photo-1605152276897-4f618f831968?w=600&auto=format&fit=crop&q=80', sku: 'GLS-11DCV-GG' }
    ],
    subtotal: 1697,
    deliveryCharge: 0,
    discount: 0,
    total: 1697,
    paymentMethod: 'Cash on Delivery (COD)',
    address: 'Flat 104, Sunrise Apartments, Sector 15',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    orderNotes: 'Deliver in evening please.',
    status: 'Delivered',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    orderNumber: 'ORD-20260827-0002',
    customerName: 'Priya Patel',
    mobile: '9786543210',
    email: 'priya@example.com',
    products: [
      { id: 'prod-9', name: 'Noise ColorFit Pulse 3 Smartwatch', brand: 'Noise', price: 1899, quantity: 1, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80', sku: 'WTC-NCP3-NS' }
    ],
    subtotal: 1899,
    deliveryCharge: 0,
    discount: 0,
    total: 1899,
    paymentMethod: 'Cash on Delivery (COD)',
    address: '45, Residency Road',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560025',
    orderNotes: '',
    status: 'Pending',
    createdAt: new Date().toISOString()
  }
];

const seedDatabase = async () => {
  try {
    // 1. Establish DB Connection
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Seed: Connected to MongoDB.');

    // 2. Clear Existing Collections
    await User.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();
    await Order.deleteMany();
    await Banner.deleteMany();
    await Settings.deleteMany();
    await Review.deleteMany();
    console.log('Seed: Cleared old database collections.');

    // 3. Create Admin User
    const adminUser = new User({
      name: 'Administrator',
      email: DEFAULT_SETTINGS.adminEmail,
      password: DEFAULT_SETTINGS.adminPassword, // hashed automatically by Mongoose pre-save hook
      role: 'admin'
    });
    await adminUser.save();
    console.log('Seed: Seeded initial Administrator user.');

    // 4. Create Website Settings
    const settings = new Settings(DEFAULT_SETTINGS);
    await settings.save();
    console.log('Seed: Seeded default Website Settings config.');

    // 5. Create Categories
    await Category.insertMany(DEFAULT_CATEGORIES);
    console.log('Seed: Seeded Categories list.');

    // 6. Create Products
    // Map temporary prod-1..10 strings to match category relations
    await Product.insertMany(DEFAULT_PRODUCTS);
    console.log('Seed: Seeded Accessories Products inventory.');

    // 7. Create Slides
    await Banner.insertMany(DEFAULT_BANNERS);
    console.log('Seed: Seeded Homepage slide banners.');

    // 8. Create Orders
    // We map custom IDs from Mongoose to match the seed orders products list
    const prodItems = await Product.find();
    const findId = (sku) => {
      const match = prodItems.find(p => p.sku === sku);
      return match ? match._id.toString() : 'prod-id-missing';
    };

    const mappedOrders = DEFAULT_ORDERS.map(ord => {
      ord.products.forEach(p => {
        p.id = findId(p.sku);
      });
      return ord;
    });

    await Order.insertMany(mappedOrders);
    console.log('Seed: Seeded Orders logs histories.');

    // 9. Create Reviews
    await Review.insertMany(DEFAULT_REVIEWS);
    console.log('Seed: Seeded customer reviews testimonials.');

    console.log('Seed database completed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

// If executed directly from shell
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
