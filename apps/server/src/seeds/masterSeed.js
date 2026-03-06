// ============================================
// OZOBATH - Master Seed Script
// Seeds: Categories, Products, Banners, Blogs,
//        FAQs, Coupons, Testimonials, DynamicContent
// ============================================
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectDB = require('../config/db');

// Models
const Category = require('../models/Category');
const Product = require('../models/Product');
const Banner = require('../models/Banner');
const Blog = require('../models/Blog');
const FAQ = require('../models/FAQ');
const Coupon = require('../models/Coupon');
const Testimonial = require('../models/Testimonial');
const DynamicContent = require('../models/DynamicContent');
const User = require('../models/User');

// ─── Placeholder images (Cloudinary public demo) ───
const IMG = {
  shower1: 'https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/leather-bag-gray',
  shower2: 'https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/accessories-bag',
  shower3: 'https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/shoe',
  faucet1: 'https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/analog-classic',
  faucet2: 'https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/watch',
  accessory1: 'https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/car-interior-design',
  basin1: 'https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/shoes',
  banner1: 'https://res.cloudinary.com/demo/image/upload/v1/samples/landscapes/nature-mountains',
  banner2: 'https://res.cloudinary.com/demo/image/upload/v1/samples/landscapes/architecture-signs',
  banner3: 'https://res.cloudinary.com/demo/image/upload/v1/samples/landscapes/beach-boat',
  blog1: 'https://res.cloudinary.com/demo/image/upload/v1/samples/landscapes/girl-urban-view',
  blog2: 'https://res.cloudinary.com/demo/image/upload/v1/samples/food/fish-vegetables',
  blog3: 'https://res.cloudinary.com/demo/image/upload/v1/samples/people/smiling-man',
};

const masterSeed = async () => {
  try {
    await connectDB();
    console.log('\n🌱 Starting Master Seed...\n');

    // Get admin user for blog author
    const admin = await User.findOne({ role: 'superadmin' });
    if (!admin) {
      console.error('❌ No super admin found. Run "npm run seed" first.');
      process.exit(1);
    }

    // ─── 1. Categories ──────────────────────────
    console.log('📂 Seeding Categories...');
    await Category.deleteMany({});
    const categories = await Category.insertMany([
      { name: 'Shower Enclosures', slug: 'shower-enclosures', description: 'Premium frameless and semi-frameless shower enclosures for modern bathrooms', order: 1, isActive: true },
      { name: 'Faucets & Taps', slug: 'faucets-taps', description: 'Designer faucets and taps crafted with precision engineering', order: 2, isActive: true },
      { name: 'Bathroom Accessories', slug: 'bathroom-accessories', description: 'Elegant accessories to complete your bathroom ensemble', order: 3, isActive: true },
      { name: 'Basin Mixers', slug: 'basin-mixers', description: 'Stylish basin mixers with advanced ceramic cartridge technology', order: 4, isActive: true },
    ]);
    console.log(`   ✅ ${categories.length} categories created`);

    // ─── 2. Products ────────────────────────────
    console.log('🛍️  Seeding Products...');
    await Product.deleteMany({});
    const products = await Product.insertMany([
      {
        name: 'Crystal Clear Frameless Shower Enclosure',
        slug: 'crystal-clear-frameless-shower',
        description: 'Ultra-premium 10mm tempered glass frameless shower enclosure with anti-limescale coating. Designed for spacious walk-in setups with minimalist hardware. Features 180° pivot hinges and full waterproof sealing.',
        shortDescription: 'Premium 10mm frameless glass shower with anti-limescale finish',
        sku: 'OZO-SHW-001',
        price: 45999, compareAtPrice: 59999, costPrice: 28000,
        category: categories[0]._id,
        images: [{ url: IMG.shower1, alt: 'Crystal Clear Frameless Shower' }],
        specifications: [{ key: 'Glass Thickness', value: '10mm' }, { key: 'Material', value: 'Tempered Glass' }, { key: 'Coating', value: 'Anti-Limescale' }, { key: 'Dimensions', value: '900mm x 1900mm' }],
        badges: ['best-seller', 'featured'],
        stock: 25, isFeatured: true,
        avgRating: 4.8, reviewCount: 124, salesCount: 340,
      },
      {
        name: 'Matte Black Sliding Door Enclosure',
        slug: 'matte-black-sliding-door',
        description: 'Contemporary matte black frame sliding shower door with 8mm safety glass. Features smooth roller mechanism for effortless operation. Industrial chic design meets bathroom luxury.',
        shortDescription: 'Matte black frame sliding shower with smooth roller system',
        sku: 'OZO-SHW-002',
        price: 38499, compareAtPrice: 49999, costPrice: 22000,
        category: categories[0]._id,
        images: [{ url: IMG.shower2, alt: 'Matte Black Sliding Door' }],
        specifications: [{ key: 'Glass Thickness', value: '8mm' }, { key: 'Frame', value: 'Matte Black Aluminum' }, { key: 'Type', value: 'Sliding Door' }],
        badges: ['new', 'featured'],
        stock: 18, isFeatured: true,
        avgRating: 4.6, reviewCount: 87, salesCount: 215,
      },
      {
        name: 'Neo-Angle Corner Shower Enclosure',
        slug: 'neo-angle-corner-shower',
        description: 'Space-saving neo-angle design that fits perfectly into bathroom corners. Features 8mm clear tempered glass with chrome hardware and magnetic sealing strip.',
        shortDescription: 'Space-saving corner shower with magnetic seal technology',
        sku: 'OZO-SHW-003',
        price: 32999, compareAtPrice: 42999, costPrice: 19000,
        category: categories[0]._id,
        images: [{ url: IMG.shower3, alt: 'Neo-Angle Corner Shower' }],
        specifications: [{ key: 'Glass Thickness', value: '8mm' }, { key: 'Hardware', value: 'Chrome' }, { key: 'Seal', value: 'Magnetic Strip' }],
        badges: ['sale'],
        stock: 12,
        avgRating: 4.5, reviewCount: 56, salesCount: 130,
      },
      {
        name: 'Luxe Waterfall Basin Faucet',
        slug: 'luxe-waterfall-basin-faucet',
        description: 'Stunning waterfall spout faucet in brushed gold finish. Features single-lever ceramic disc cartridge for precise temperature control. A statement piece for any vanity.',
        shortDescription: 'Brushed gold waterfall faucet with ceramic cartridge',
        sku: 'OZO-FAU-001',
        price: 8999, compareAtPrice: 12999, costPrice: 4500,
        category: categories[1]._id,
        images: [{ url: IMG.faucet1, alt: 'Luxe Waterfall Faucet' }],
        specifications: [{ key: 'Finish', value: 'Brushed Gold' }, { key: 'Cartridge', value: 'Ceramic Disc' }, { key: 'Spout Type', value: 'Waterfall' }],
        badges: ['best-seller'],
        stock: 40, isFeatured: true,
        avgRating: 4.9, reviewCount: 203, salesCount: 520,
      },
      {
        name: 'Minimalist Chrome Pillar Tap Set',
        slug: 'minimalist-chrome-pillar-tap',
        description: 'Clean-lined chrome pillar tap set with quarter-turn handles. Perfect for traditional and modern bathrooms. Durable brass body with mirror chrome finish.',
        shortDescription: 'Chrome pillar taps with quarter-turn brass mechanism',
        sku: 'OZO-FAU-002',
        price: 4999, compareAtPrice: 6999, costPrice: 2800,
        category: categories[1]._id,
        images: [{ url: IMG.faucet2, alt: 'Chrome Pillar Tap' }],
        specifications: [{ key: 'Finish', value: 'Mirror Chrome' }, { key: 'Body', value: 'Brass' }, { key: 'Handle', value: 'Quarter Turn' }],
        badges: ['sale'],
        stock: 60,
        avgRating: 4.4, reviewCount: 91, salesCount: 310,
      },
      {
        name: 'Sensor-Touch Smart Faucet',
        slug: 'sensor-touch-smart-faucet',
        description: 'Touch-free infrared sensor faucet with adjustable temperature LED indicator. Battery-powered with 2-year lifespan. Ideal for modern smart bathrooms.',
        shortDescription: 'Touch-free sensor faucet with LED temperature display',
        sku: 'OZO-FAU-003',
        price: 14999, compareAtPrice: 19999, costPrice: 8000,
        category: categories[1]._id,
        images: [{ url: IMG.faucet1, alt: 'Smart Sensor Faucet' }],
        specifications: [{ key: 'Sensor', value: 'Infrared' }, { key: 'Power', value: 'Battery (AA x 4)' }, { key: 'Feature', value: 'LED Temperature Indicator' }],
        badges: ['new', 'featured'],
        stock: 15, isFeatured: true,
        avgRating: 4.7, reviewCount: 42, salesCount: 95,
      },
      {
        name: 'Stainless Steel Towel Rack — Wall Mount',
        slug: 'stainless-steel-towel-rack',
        description: 'Heavy-duty 304 stainless steel towel rack with dual bars. Rust-proof satin finish, concealed mounting hardware. Supports up to 10kg per bar.',
        shortDescription: 'Dual-bar SS304 towel rack with concealed mounting',
        sku: 'OZO-ACC-001',
        price: 3499, compareAtPrice: 4999, costPrice: 1800,
        category: categories[2]._id,
        images: [{ url: IMG.accessory1, alt: 'Towel Rack' }],
        specifications: [{ key: 'Material', value: '304 Stainless Steel' }, { key: 'Finish', value: 'Satin' }, { key: 'Load Capacity', value: '10kg per bar' }],
        badges: ['best-seller'],
        stock: 80,
        avgRating: 4.6, reviewCount: 178, salesCount: 620,
      },
      {
        name: 'Premium Glass Shelf with Guard Rail',
        slug: 'premium-glass-shelf-guard-rail',
        description: '8mm frosted tempered glass shelf with chrome guard rail and brackets. Perfect for toiletries and decorative items. Easy wall-mount installation.',
        shortDescription: 'Frosted glass shelf with chrome rail and mounting kit',
        sku: 'OZO-ACC-002',
        price: 2499, compareAtPrice: 3499, costPrice: 1200,
        category: categories[2]._id,
        images: [{ url: IMG.accessory1, alt: 'Glass Shelf' }],
        specifications: [{ key: 'Glass', value: '8mm Frosted Tempered' }, { key: 'Rail', value: 'Chrome' }, { key: 'Size', value: '500mm x 120mm' }],
        badges: [],
        stock: 50,
        avgRating: 4.3, reviewCount: 64, salesCount: 240,
      },
      {
        name: 'Artisan Single-Lever Basin Mixer',
        slug: 'artisan-single-lever-basin-mixer',
        description: 'Ergonomic single-lever basin mixer with 40mm ceramic cartridge. Features an extended spout for comfortable hand washing and aerator for water saving.',
        shortDescription: 'Single-lever basin mixer with water-saving aerator',
        sku: 'OZO-BAS-001',
        price: 6999, compareAtPrice: 9999, costPrice: 3800,
        category: categories[3]._id,
        images: [{ url: IMG.basin1, alt: 'Artisan Basin Mixer' }],
        specifications: [{ key: 'Cartridge', value: '40mm Ceramic' }, { key: 'Feature', value: 'Water-Saving Aerator' }, { key: 'Spout', value: 'Extended' }],
        badges: ['featured'],
        stock: 35, isFeatured: true,
        avgRating: 4.7, reviewCount: 112, salesCount: 380,
      },
      {
        name: 'Rose Gold Tall Basin Mixer',
        slug: 'rose-gold-tall-basin-mixer',
        description: 'Stunning rose gold tall basin mixer designed for countertop basins. Features a sleek cylindrical body with single-lever control and 35mm cartridge.',
        shortDescription: 'Rose gold tall mixer for countertop vessels',
        sku: 'OZO-BAS-002',
        price: 11999, compareAtPrice: 15999, costPrice: 6500,
        category: categories[3]._id,
        images: [{ url: IMG.basin1, alt: 'Rose Gold Basin Mixer' }],
        specifications: [{ key: 'Finish', value: 'Rose Gold PVD' }, { key: 'Cartridge', value: '35mm Ceramic' }, { key: 'Type', value: 'Tall / Vessel' }],
        badges: ['new', 'limited'],
        stock: 8,
        avgRating: 4.9, reviewCount: 28, salesCount: 65,
      },
    ]);
    console.log(`   ✅ ${products.length} products created`);

    // Link related products (cross-sell)
    console.log('🔗 Linking Related Products...');
    const p = products; // shorthand
    const relatedMap = [
      [0, [1, 2, 6]],   // Crystal Clear → Matte Black, Neo-Angle, Towel Rack
      [1, [0, 2, 3]],   // Matte Black → Crystal Clear, Neo-Angle, Waterfall Faucet
      [2, [0, 1, 7]],   // Neo-Angle → Crystal Clear, Matte Black, Glass Shelf
      [3, [4, 5, 8]],   // Waterfall Faucet → Pillar Tap, Smart Faucet, Basin Mixer
      [4, [3, 5, 6]],   // Pillar Tap → Waterfall, Smart Faucet, Towel Rack
      [5, [3, 4, 9]],   // Smart Faucet → Waterfall, Pillar, Rose Gold
      [6, [7, 0, 1]],   // Towel Rack → Glass Shelf, Crystal Clear, Matte Black
      [7, [6, 2, 8]],   // Glass Shelf → Towel Rack, Neo-Angle, Basin Mixer
      [8, [9, 3, 5]],   // Artisan Mixer → Rose Gold, Waterfall, Smart
      [9, [8, 3, 5]],   // Rose Gold → Artisan, Waterfall, Smart
    ];
    for (const [idx, relIds] of relatedMap) {
      await Product.findByIdAndUpdate(p[idx]._id, {
        relatedProducts: relIds.map(i => p[i]._id),
      });
    }
    console.log('   ✅ Related products linked');

    // Update category product counts
    for (const cat of categories) {
      const count = await Product.countDocuments({ category: cat._id });
      await Category.findByIdAndUpdate(cat._id, { productCount: count });
    }

    // ─── 3. Banners ─────────────────────────────
    console.log('🖼️  Seeding Banners...');
    await Banner.deleteMany({});
    const banners = await Banner.insertMany([
      {
        title: 'Elevate Your Bathroom',
        subtitle: 'Premium Collection 2026',
        description: 'Discover frameless shower enclosures crafted for modern luxury living',
        image: { url: IMG.banner1, alt: 'OZOBATH Hero Banner' },
        link: '/shop', buttonText: 'Shop Now',
        page: 'home', position: 'hero', order: 1, isActive: true, textColor: '#ffffff',
      },
      {
        title: 'Up to 30% Off',
        subtitle: 'Summer Sale',
        description: 'Premium faucets and accessories at unbeatable prices',
        image: { url: IMG.banner2, alt: 'Summer Sale Banner' },
        link: '/shop?badge=sale', buttonText: 'View Deals',
        page: 'home', position: 'hero', order: 2, isActive: true, textColor: '#ffffff',
      },
      {
        title: 'Experience Centre',
        subtitle: 'Visit Our Showroom',
        description: 'Touch, feel, and experience our products in person at our Bangalore showroom',
        image: { url: IMG.banner3, alt: 'Experience Centre Banner' },
        link: '/experience-centre', buttonText: 'Book a Visit',
        page: 'home', position: 'hero', order: 3, isActive: true, textColor: '#ffffff',
      },
    ]);
    console.log(`   ✅ ${banners.length} banners created`);

    // ─── 4. Blogs ───────────────────────────────
    console.log('📝 Seeding Blogs...');
    await Blog.deleteMany({});
    const blogs = await Blog.insertMany([
      {
        title: 'Top 10 Bathroom Design Trends for 2026',
        slug: 'top-10-bathroom-design-trends-2026',
        excerpt: 'From frameless glass to warm neutrals, discover the trends shaping modern bathrooms this year.',
        content: '<h2>1. Frameless Glass Dominance</h2><p>Frameless shower enclosures continue to dominate modern bathroom designs. Their seamless appearance creates an illusion of space, making even small bathrooms feel open and airy. At OZOBATH, our Crystal Clear series exemplifies this trend perfectly.</p><h2>2. Warm Neutral Palettes</h2><p>Gone are the stark white bathrooms. This year, warm neutrals — cream, taupe, and soft beige — create inviting, spa-like atmospheres that feel both luxurious and comfortable.</p><h2>3. Smart Fixtures</h2><p>Technology integration in bathrooms has become mainstream. From sensor faucets to LED-lit mirrors, smart fixtures add convenience without compromising on style. Our Sensor-Touch Smart Faucet leads this category.</p><h2>4. Matte Black Hardware</h2><p>Matte black continues its reign as the hardware finish of choice. It adds dramatic contrast and industrial elegance to any bathroom design.</p><h2>5. Sustainable Materials</h2><p>Eco-conscious choices like recycled glass, water-efficient fixtures, and sustainable manufacturing processes are becoming standard in premium bathroom designs.</p>',
        featuredImage: { url: IMG.blog1, alt: 'Bathroom Design Trends 2026' },
        author: admin._id, category: 'Design', tags: ['Design', 'Trends', '2026', 'Bathroom'],
        isPublished: true, publishedAt: new Date('2026-02-15'), views: 2340,
      },
      {
        title: 'How to Choose the Perfect Shower Enclosure',
        slug: 'how-to-choose-perfect-shower-enclosure',
        excerpt: 'A comprehensive guide to selecting the right shower enclosure for your space, style, and budget.',
        content: '<h2>Consider Your Space</h2><p>Before choosing a shower enclosure, measure your bathroom carefully. Consider the door swing direction, plumbing location, and available floor area. Corner enclosures like our Neo-Angle design work brilliantly in compact spaces.</p><h2>Glass Options</h2><p>We recommend 8mm or 10mm tempered safety glass for durability. Consider anti-limescale coatings — they reduce cleaning time by up to 70%. Our Crystal Clear range features this coating as standard.</p><h2>Frame vs Frameless</h2><p>Frameless enclosures offer a clean, modern look and are easier to clean. Framed options provide more structural rigidity and are typically more affordable. Semi-frameless designs offer a balance of both.</p><h2>Budget Planning</h2><p>Invest in quality — a good shower enclosure should last 15-20 years. Consider it a long-term investment in your home value and daily comfort.</p>',
        featuredImage: { url: IMG.blog2, alt: 'Choosing Shower Enclosure' },
        author: admin._id, category: 'Guide', tags: ['Guide', 'Shower', 'Buying Guide'],
        isPublished: true, publishedAt: new Date('2026-02-20'), views: 1560,
      },
      {
        title: 'Bathroom Maintenance: Tips from Our Experts',
        slug: 'bathroom-maintenance-expert-tips',
        excerpt: 'Keep your bathroom fixtures looking new with these professional maintenance tips.',
        content: '<h2>Daily Care</h2><p>After every shower, squeegee the glass to prevent water spots and mineral buildup. This simple 30-second habit can keep your enclosure looking brand new for years.</p><h2>Weekly Cleaning</h2><p>Use a mild, non-abrasive cleaner on all surfaces. Avoid harsh chemicals like bleach on chrome finishes — they can cause pitting and discoloration over time.</p><h2>Faucet Care</h2><p>Clean faucets with a soft cloth dampened with warm soapy water. For mineral deposits, use a 50/50 vinegar-water solution. Never use steel wool or abrasive pads on any finish.</p><h2>Seal Inspection</h2><p>Check silicone seals around your shower enclosure every 6 months. Replace any cracked or moldy seals immediately to prevent water damage to your walls and floor.</p>',
        featuredImage: { url: IMG.blog3, alt: 'Bathroom Maintenance' },
        author: admin._id, category: 'Tips', tags: ['Maintenance', 'Tips', 'Care'],
        isPublished: true, publishedAt: new Date('2026-02-25'), views: 890,
      },
      {
        title: 'Small Bathroom? Big Ideas to Maximize Space',
        slug: 'small-bathroom-big-ideas',
        excerpt: 'Transform your compact bathroom into a luxurious retreat with these clever design strategies.',
        content: '<h2>Go Frameless</h2><p>Frameless glass shower enclosures are a game-changer for small bathrooms. They eliminate visual barriers and let light flow freely, making the space feel significantly larger.</p><h2>Wall-Mounted Fixtures</h2><p>Choose wall-mounted faucets, shelves, and towel racks to free up floor space. Our Stainless Steel Towel Rack with concealed mounting is perfect for this approach.</p><h2>Light Colors</h2><p>Use light, reflective tiles and neutral colors to bounce light around the room. Combine with good lighting design — LED mirror cabinets serve dual purposes beautifully.</p><h2>Corner Solutions</h2><p>Utilize corners with neo-angle shower enclosures and corner shelves. Our Neo-Angle Corner Shower Enclosure was specifically designed for space optimization.</p>',
        featuredImage: { url: IMG.blog1, alt: 'Small Bathroom Ideas' },
        author: admin._id, category: 'Design', tags: ['Small Bathroom', 'Design', 'Space'],
        isPublished: true, publishedAt: new Date('2026-03-01'), views: 670,
      },
      {
        title: 'The Rise of Smart Bathrooms in India',
        slug: 'rise-of-smart-bathrooms-india',
        excerpt: 'How technology is transforming Indian bathrooms — from sensor faucets to heated floors.',
        content: '<h2>The Smart Revolution</h2><p>Indian homeowners are increasingly embracing smart bathroom technology. The market for sensor-operated fixtures, digital shower controls, and smart mirrors has grown 45% year-over-year.</p><h2>Sensor Faucets</h2><p>Touch-free faucets have moved from commercial spaces into homes. They offer hygiene benefits, water conservation (up to 50% savings), and a futuristic aesthetic. Our Sensor-Touch Smart Faucet with LED temperature indicator leads this segment.</p><h2>Digital Shower Panels</h2><p>Programmable shower panels that remember your preferred temperature and flow rate are gaining popularity among tech-savvy homeowners.</p><h2>Water Conservation</h2><p>Smart fixtures aren\'t just about convenience — they\'re about sustainability. Aerators, low-flow showerheads, and sensor taps significantly reduce water consumption without compromising the bathing experience.</p>',
        featuredImage: { url: IMG.blog2, alt: 'Smart Bathrooms India' },
        author: admin._id, category: 'Technology', tags: ['Smart Home', 'Technology', 'India'],
        isPublished: true, publishedAt: new Date('2026-03-05'), views: 415,
      },
    ]);
    console.log(`   ✅ ${blogs.length} blogs created`);

    // ─── 5. FAQs ────────────────────────────────
    console.log('❓ Seeding FAQs...');
    await FAQ.deleteMany({});
    const faqs = await FAQ.insertMany([
      { question: 'What is the warranty on OZOBATH products?', answer: 'All shower enclosures come with a 5-year warranty. Faucets and taps have a 3-year warranty. Accessories carry a 2-year warranty against manufacturing defects.', category: 'warranty', order: 1 },
      { question: 'Do you offer free shipping?', answer: 'Yes! We offer FREE shipping on all orders above ₹999 across India. Orders below ₹999 have a flat ₹99 shipping fee.', category: 'shipping', order: 2 },
      { question: 'How long does delivery take?', answer: 'Standard delivery takes 5-7 business days. Metro cities (Bangalore, Mumbai, Delhi, Chennai, Hyderabad) get faster delivery in 3-5 business days.', category: 'shipping', order: 3 },
      { question: 'Do you provide installation services?', answer: 'Yes, we offer professional installation services in select cities. Contact our support team or submit a service request for installation assistance.', category: 'installation', order: 4 },
      { question: 'Can I return or exchange a product?', answer: 'Returns are accepted within 7 days of delivery for products in original condition with packaging. Custom-made items are non-returnable. Contact us within 48 hours for damaged products.', category: 'returns', order: 5 },
      { question: 'What payment methods do you accept?', answer: 'We accept all major payment methods via Razorpay — UPI, credit/debit cards, net banking, and EMI options on select cards.', category: 'payment', order: 6 },
      { question: 'Do you offer bulk ordering for builders?', answer: 'Absolutely! We have a dedicated B2B program with special pricing for architects, builders, and interior designers. Visit our B2B page or contact us for custom quotes.', category: 'general', order: 7 },
      { question: 'Can I visit your showroom?', answer: 'Yes! Our Experience Centre is located in Bangalore, Karnataka. We are open Mon-Sat (10 AM - 7 PM). Book a visit on our website or call +91 7899202927.', category: 'general', order: 8 },
    ]);
    console.log(`   ✅ ${faqs.length} FAQs created`);

    // ─── 6. Coupons ─────────────────────────────
    console.log('🎟️  Seeding Coupons...');
    await Coupon.deleteMany({});
    const coupons = await Coupon.insertMany([
      {
        code: 'WELCOME10', description: 'Welcome offer — 10% off your first order',
        type: 'percentage', value: 10, maxDiscount: 2000, minOrderAmount: 2000,
        usageLimit: 500, perUserLimit: 1,
        startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), isActive: true,
      },
      {
        code: 'BULK20', description: 'Bulk order discount — 20% off on orders above ₹50,000',
        type: 'percentage', value: 20, maxDiscount: 15000, minOrderAmount: 50000,
        usageLimit: 100, perUserLimit: 2,
        startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), isActive: true,
      },
      {
        code: 'FLAT500', description: 'Flat ₹500 off on orders above ₹5,000',
        type: 'fixed', value: 500, minOrderAmount: 5000,
        usageLimit: 1000, perUserLimit: 3,
        startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), isActive: true,
      },
    ]);
    console.log(`   ✅ ${coupons.length} coupons created`);

    // ─── 7. Testimonials ────────────────────────
    console.log('💬 Seeding Testimonials...');
    await Testimonial.deleteMany({});
    const testimonials = await Testimonial.insertMany([
      { name: 'Rajesh Sharma', designation: 'Homeowner', company: 'Bangalore', rating: 5, comment: 'The Crystal Clear shower enclosure transformed my bathroom completely. The quality is outstanding — it feels like a 5-star hotel. Installation was smooth and the team was very professional.', order: 1 },
      { name: 'Priya Nair', designation: 'Interior Designer', company: 'Studio Priya', rating: 5, comment: 'I recommend OZOBATH to all my clients. The product range is excellent, and the B2B pricing makes it viable for large projects. The matte black collection is absolutely stunning.', order: 2 },
      { name: 'Arjun Mehta', designation: 'Architect', company: 'Mehta & Associates', rating: 4, comment: 'High-quality products with great attention to detail. The precision engineering is evident in every piece. Have used OZOBATH in 12+ residential projects so far.', order: 3 },
      { name: 'Sneha Patel', designation: 'Homeowner', company: 'Mumbai', rating: 5, comment: 'Ordered the waterfall faucet and towel rack — both exceeded expectations. The brushed gold finish is gorgeous in person. Delivery was faster than expected too!', order: 4 },
    ]);
    console.log(`   ✅ ${testimonials.length} testimonials created`);

    // ─── 8. Dynamic Content ─────────────────────
    console.log('📄 Seeding Dynamic Content...');
    await DynamicContent.deleteMany({});
    const dynamicContent = await DynamicContent.insertMany([
      {
        page: 'global', section: 'announcement_bar', order: 1, isActive: true,
        content: { title: '🚚 Free Shipping on orders above ₹999 | Use code WELCOME10 for 10% off', buttonText: 'Shop Now', buttonLink: '/shop' },
      },
      {
        page: 'home', section: 'trust_badges', order: 2, isActive: true,
        content: {
          title: 'Why Choose OZOBATH',
          items: [
            { icon: 'truck', title: 'Free Shipping', description: 'On orders above ₹999' },
            { icon: 'shield', title: '5-Year Warranty', description: 'Comprehensive coverage' },
            { icon: 'clock', title: 'Easy Installation', description: 'Professional support' },
            { icon: 'refresh', title: '7-Day Returns', description: 'Hassle-free returns' },
          ],
        },
      },
      {
        page: 'home', section: 'cta_banner', order: 3, isActive: true,
        content: {
          title: 'Ready to Transform Your Bathroom?',
          subtitle: 'Book a free consultation with our design experts',
          buttonText: 'Book Site Visit', buttonLink: '/book-site-visit',
          secondaryButtonText: 'Shop Live', secondaryButtonLink: '/shop-live',
        },
      },
    ]);
    console.log(`   ✅ ${dynamicContent.length} dynamic content entries created`);

    // ─── Summary ────────────────────────────────
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║        🌱 MASTER SEED COMPLETE               ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  Categories      : ${String(categories.length).padEnd(25)}║`);
    console.log(`║  Products        : ${String(products.length).padEnd(25)}║`);
    console.log(`║  Banners         : ${String(banners.length).padEnd(25)}║`);
    console.log(`║  Blogs           : ${String(blogs.length).padEnd(25)}║`);
    console.log(`║  FAQs            : ${String(faqs.length).padEnd(25)}║`);
    console.log(`║  Coupons         : ${String(coupons.length).padEnd(25)}║`);
    console.log(`║  Testimonials    : ${String(testimonials.length).padEnd(25)}║`);
    console.log(`║  Dynamic Content : ${String(dynamicContent.length).padEnd(25)}║`);
    console.log('╚══════════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Master Seed failed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

masterSeed();
