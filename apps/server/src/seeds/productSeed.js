// ============================================
// OZOBATH - Real Product Seed
// Uploads actual product images to Cloudinary
// and creates the real product catalog
//
// Usage: node src/seeds/productSeed.js
// ============================================
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectDB = require('../config/db');
const cloudinary = require('../config/cloudinary');
const Category = require('../models/Category');
const Product = require('../models/Product');

// ─── Image directory ────────────────────────────
const IMG_DIR = path.resolve(__dirname, '../../../Product imaegs');

// ─── Image file → Cloudinary upload helper ──────
async function uploadLocalImage(filename, folder = 'ozobath-products') {
  const filePath = path.join(IMG_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠️  Image not found: ${filename}`);
    return null;
  }
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    use_filename: false,
    unique_filename: true,
  });
  console.log(`  ☁️  Uploaded: ${filename} → ${result.secure_url}`);
  return { url: result.secure_url, publicId: result.public_id };
}

const productSeed = async () => {
  await connectDB();
  console.log('\n🌱 Starting OZOBATH Real Product Seed...\n');

  // ─── 1. Ensure categories ─────────────────────
  console.log('📂 Setting up categories...');
  let showerCat = await Category.findOne({ slug: 'shower-enclosures' });
  if (!showerCat) {
    showerCat = await Category.create({
      name: 'Shower Enclosures', slug: 'shower-enclosures',
      description: 'Premium custom shower enclosures in chrome, black matte, gold and rosegold finishes',
      order: 1, isActive: true,
    });
  }

  let sanitaryCat = await Category.findOne({ slug: 'sanitary-accessories' });
  if (!sanitaryCat) {
    sanitaryCat = await Category.create({
      name: 'Sanitary & Accessories', slug: 'sanitary-accessories',
      description: 'Bathroom sanitary sets, cleaning products and shower kits',
      order: 2, isActive: true,
    });
  }
  console.log('  ✅ Categories ready\n');

  // ─── 2. Upload images ─────────────────────────
  console.log('☁️  Uploading product images to Cloudinary...');

  // Partial Shower Enclosure images (Rosegold/Copper finish)
  const partialFrosted1 = await uploadLocalImage('file_0000000015ac71faaa2af8856a208f3a.png');
  const partialFrosted2 = await uploadLocalImage('file_00000000523471faa8c77b2a22e1c9de.png');
  const partialLacquered = await uploadLocalImage('file_000000005d4c71fa847eb2e56abd6ed2.png');
  const partialClear = await uploadLocalImage('file_0000000073c071fabc94b45375495da4.jpg.jpeg');
  const partialFluted = await uploadLocalImage('file_00000000f75871fa8723463759ae1fb2.png');

  // Sliding Shower Enclosure images
  const slidingChromeClear = await uploadLocalImage('file_00000000278c7208a54b92db5fba6b6c.png');
  const slidingChromeFrosted1 = await uploadLocalImage('file_00000000412871fa9adc37fe7400f883.png');
  const slidingGoldFrosted1 = await uploadLocalImage('file_0000000031c871fa96cbe96c02e922a0.png');
  const slidingGoldFrosted2 = await uploadLocalImage('file_0000000063b471fabe4728b4722f2681.png');
  const slidingGoldLacquered = await uploadLocalImage('file_00000000654471fa9cf2e647a9276508.png');
  const slidingChromeFluted = await uploadLocalImage('file_000000009e7472089cb2a061dd07a07f.png');
  const slidingChromeLacquered = await uploadLocalImage('file_00000000a78472089d0de4e057eb8ed1.png');
  const slidingChromeFrosted2 = await uploadLocalImage('file_00000000b04c7208bf84253e05b57886.png');
  const slidingGoldFluted = await uploadLocalImage('file_00000000eff471fa809019dfcdc00c0e.png');

  // Swing Shower Enclosure images (Black Matte)
  const swingBlackFrosted1 = await uploadLocalImage('Picsart_26-03-07_17-37-26-573.jpg.jpeg');
  const swingBlackFluted = await uploadLocalImage('Picsart_26-03-07_17-38-11-666.jpg.jpeg');
  const swingBlackClear1 = await uploadLocalImage('Picsart_26-03-07_17-44-58-359.jpg.jpeg');
  const swingBlackClear2 = await uploadLocalImage('Picsart_26-03-07_17-46-27-286.jpg.jpeg');
  const swingBlackFrosted2 = await uploadLocalImage('file_00000000b4ac71faa8796424169cbbf3.png');

  // L-Shape Shower Enclosure images
  const lshapeChromeAll = await uploadLocalImage('file_00000000637071fa968f13a8779d69ba.png');
  const lshapeGoldClear = await uploadLocalImage('file_000000009d5871fabc6d9ee011882589.png');

  // Sanitary images
  const sanitaryBasin1 = await uploadLocalImage('1b22d7e7929883b921c4139ecca52ba229a13b56587956d49b350fc06a52cf8b.webp');
  const sanitaryBasin2 = await uploadLocalImage('36ff1267d2998cd78fa8d42bb113d27f2cc5bb37a307f6e529f5cccd64d6cb30.webp');
  const sanitaryFaucet = await uploadLocalImage('419e422814bb83f397003504a70ec59bbeb9636d39bff33282de5e9fade0216d.webp');

  console.log('\n🛍️  Creating products...\n');

  const makeImages = (...imgs) => imgs.filter(Boolean).map(img => ({ url: img.url, publicId: img.publicId }));

  // Clear any existing real OZOBATH products (keep demo products or delete all)
  await Product.deleteMany({
    slug: {
      $in: [
        'partial-shower-enclosure-rosegold',
        'sliding-shower-enclosure-gold',
        'swing-shower-enclosure-black-matte',
        'lshape-shower-enclosure-chrome',
        'lshape-double-door-shower-enclosure',
        'hydrophobic-coating-shower-enclosure',
        'hydrophobic-coating-sanitary-set',
        'ozo-stain-remover',
        'ozobath-shower-kit',
      ],
    },
  });

  await Product.insertMany([

    // ────────────────────────────────────────────────
    // 1. PARTIAL SHOWER ENCLOSURE
    // ────────────────────────────────────────────────
    {
      name: 'Partial Shower Enclosure — Rosegold Glossy',
      slug: 'partial-shower-enclosure-rosegold',
      sku: 'OZO-PSE-RSG-001',
      brand: 'OZOBATH',
      shortDescription: 'Walk-in partial shower enclosure in premium rosegold glossy finish. Priced per square foot.',
      description: `Premium walk-in partial shower enclosure with luxurious rosegold glossy hardware. A single-panel design that creates an open, spacious shower experience while maintaining an elegant aesthetic.

**Glass Options & Pricing (per sq.ft):**
• Clear Glass — ₹559/sqft
• Frosted Glass — ₹689/sqft
• Fluted Glass — ₹999/sqft
• Lacquered Glass — ₹1,499/sqft

**Available Finishes:** Chrome Glossy, Black Matte, Gold Glossy, Rosegold Glossy

**Hydrophobic Coating Add-on:** ₹85/sqft (keeps glass spotless longer)

Enter your required area (in sq.ft) as quantity at checkout. Minimum order 10 sqft. Custom sizes available.`,
      price: 559,
      compareAtPrice: 699,
      costPrice: 320,
      category: showerCat._id,
      subCategory: 'Partial',
      images: makeImages(partialFrosted1, partialClear, partialFrosted2, partialFluted, partialLacquered),
      variants: [
        {
          name: 'Finish',
          options: [
            { label: 'Rosegold Glossy', value: 'rosegold-glossy', priceModifier: 0 },
            { label: 'Chrome Glossy', value: 'chrome-glossy', priceModifier: -30 },
            { label: 'Black Matte', value: 'black-matte', priceModifier: -30 },
            { label: 'Gold Glossy', value: 'gold-glossy', priceModifier: 0 },
          ],
        },
        {
          name: 'Glass Type',
          options: [
            { label: 'Clear Glass', value: 'clear', priceModifier: 0 },
            { label: 'Frosted Glass', value: 'frosted', priceModifier: 130 },
            { label: 'Fluted Glass', value: 'fluted', priceModifier: 440 },
            { label: 'Lacquered Glass', value: 'lacquered', priceModifier: 940 },
          ],
        },
      ],
      specifications: [
        { key: 'Price Unit', value: 'Per Square Foot (SQFT)' },
        { key: 'Glass Thickness', value: '8mm Toughened Safety Glass' },
        { key: 'Hardware Finish', value: 'Rosegold Glossy' },
        { key: 'Glass Options', value: 'Clear | Frosted | Fluted | Lacquered' },
        { key: 'Min Order', value: '10 SQFT' },
        { key: 'Lead Time', value: '7–10 working days' },
        { key: 'Installation', value: 'Professional installation recommended' },
        { key: 'Warranty', value: '5 Years on Hardware' },
      ],
      badges: ['featured'],
      stock: 999,
      trackInventory: false,
      isActive: true,
      isFeatured: true,
      avgRating: 4.8, reviewCount: 0, salesCount: 0,
      tags: ['shower', 'partial', 'walk-in', 'rosegold', 'premium', 'custom'],
    },

    // ────────────────────────────────────────────────
    // 2. SLIDING SHOWER ENCLOSURE
    // ────────────────────────────────────────────────
    {
      name: 'Sliding Shower Enclosure — Gold Glossy',
      slug: 'sliding-shower-enclosure-gold',
      sku: 'OZO-SSE-GLD-001',
      brand: 'OZOBATH',
      shortDescription: 'Space-efficient sliding door shower enclosure in gold glossy finish. Priced per square foot.',
      description: `Elegant sliding shower enclosure with smooth-gliding panels and premium gold glossy hardware. The sliding mechanism makes it ideal for bathrooms where a swing door would be impractical.

**Glass Options & Pricing (per sq.ft):**
• Clear Glass — ₹666/sqft
• Frosted Glass — ₹749/sqft
• Fluted Glass — ₹999/sqft
• Lacquered Glass — ₹1,399/sqft

**Available Finishes:** Chrome Glossy, Black Matte, Gold Glossy, Rosegold Glossy

**Hydrophobic Coating Add-on:** ₹85/sqft

Enter your required glass area (in sq.ft) as quantity at checkout. Minimum order 15 sqft. Custom sizes available.`,
      price: 666,
      compareAtPrice: 849,
      costPrice: 400,
      category: showerCat._id,
      subCategory: 'Sliding',
      images: makeImages(slidingGoldFrosted1, slidingChromeClear, slidingGoldFrosted2, slidingChromeFluted, slidingGoldFluted, slidingGoldLacquered, slidingChromeFrosted1, slidingChromeFrosted2, slidingChromeLacquered),
      variants: [
        {
          name: 'Finish',
          options: [
            { label: 'Gold Glossy', value: 'gold-glossy', priceModifier: 0 },
            { label: 'Chrome Glossy', value: 'chrome-glossy', priceModifier: 0 },
            { label: 'Black Matte', value: 'black-matte', priceModifier: 0 },
            { label: 'Rosegold Glossy', value: 'rosegold-glossy', priceModifier: 0 },
          ],
        },
        {
          name: 'Glass Type',
          options: [
            { label: 'Clear Glass', value: 'clear', priceModifier: 0 },
            { label: 'Frosted Glass', value: 'frosted', priceModifier: 83 },
            { label: 'Fluted Glass', value: 'fluted', priceModifier: 333 },
            { label: 'Lacquered Glass', value: 'lacquered', priceModifier: 733 },
          ],
        },
      ],
      specifications: [
        { key: 'Price Unit', value: 'Per Square Foot (SQFT)' },
        { key: 'Glass Thickness', value: '8mm Toughened Safety Glass' },
        { key: 'Hardware Finish', value: 'Gold Glossy' },
        { key: 'Door Type', value: 'Sliding (Bypass)' },
        { key: 'Min Order', value: '15 SQFT' },
        { key: 'Lead Time', value: '7–10 working days' },
        { key: 'Warranty', value: '5 Years on Hardware' },
      ],
      badges: ['best-seller', 'featured'],
      stock: 999,
      trackInventory: false,
      isActive: true,
      isFeatured: true,
      avgRating: 4.9, reviewCount: 0, salesCount: 0,
      tags: ['shower', 'sliding', 'gold', 'premium', 'custom'],
    },

    // ────────────────────────────────────────────────
    // 3. SWING SHOWER ENCLOSURE
    // ────────────────────────────────────────────────
    {
      name: 'Swing Shower Enclosure — Black Matte',
      slug: 'swing-shower-enclosure-black-matte',
      sku: 'OZO-WSE-BLK-001',
      brand: 'OZOBATH',
      shortDescription: 'Premium L-shape swing door shower enclosure in bold black matte finish. Priced per square foot.',
      description: `Bold and contemporary L-shape swing shower enclosure with a matte black finish that makes a strong design statement. The swing door opens wide for easy access and a premium shower experience.

**Glass Options & Pricing (per sq.ft):**
• Clear Glass — ₹649/sqft
• Frosted Glass — ₹749/sqft
• Fluted Glass — ₹999/sqft
• Lacquered Glass — ₹1,399/sqft

**Available Finishes:** Chrome Glossy, Black Matte, Gold Glossy, Rosegold Glossy

**Hydrophobic Coating Add-on:** ₹85/sqft

Enter your required glass area (in sq.ft) as quantity at checkout. Minimum order 15 sqft.`,
      price: 649,
      compareAtPrice: 849,
      costPrice: 390,
      category: showerCat._id,
      subCategory: 'Swing',
      images: makeImages(swingBlackClear1, swingBlackFrosted1, swingBlackFluted, swingBlackClear2, swingBlackFrosted2),
      variants: [
        {
          name: 'Finish',
          options: [
            { label: 'Black Matte', value: 'black-matte', priceModifier: 0 },
            { label: 'Chrome Glossy', value: 'chrome-glossy', priceModifier: 0 },
            { label: 'Gold Glossy', value: 'gold-glossy', priceModifier: 0 },
            { label: 'Rosegold Glossy', value: 'rosegold-glossy', priceModifier: 0 },
          ],
        },
        {
          name: 'Glass Type',
          options: [
            { label: 'Clear Glass', value: 'clear', priceModifier: 0 },
            { label: 'Frosted Glass', value: 'frosted', priceModifier: 100 },
            { label: 'Fluted Glass', value: 'fluted', priceModifier: 350 },
            { label: 'Lacquered Glass', value: 'lacquered', priceModifier: 750 },
          ],
        },
      ],
      specifications: [
        { key: 'Price Unit', value: 'Per Square Foot (SQFT)' },
        { key: 'Glass Thickness', value: '8mm Toughened Safety Glass' },
        { key: 'Hardware Finish', value: 'Black Matte' },
        { key: 'Door Type', value: 'Swing (Hinged)' },
        { key: 'Configuration', value: 'L-Shape' },
        { key: 'Min Order', value: '15 SQFT' },
        { key: 'Lead Time', value: '7–10 working days' },
        { key: 'Warranty', value: '5 Years on Hardware' },
      ],
      badges: ['new', 'featured'],
      stock: 999,
      trackInventory: false,
      isActive: true,
      isFeatured: true,
      avgRating: 4.7, reviewCount: 0, salesCount: 0,
      tags: ['shower', 'swing', 'black', 'matte', 'l-shape', 'premium', 'custom'],
    },

    // ────────────────────────────────────────────────
    // 4. L-SHAPE SHOWER ENCLOSURE
    // ────────────────────────────────────────────────
    {
      name: 'L-Shape Shower Enclosure — Chrome Glossy',
      slug: 'lshape-shower-enclosure-chrome',
      sku: 'OZO-LSE-CHR-001',
      brand: 'OZOBATH',
      shortDescription: 'Full L-shape corner shower enclosure with chrome hardware. Priced per square foot.',
      description: `Spacious L-shape corner shower enclosure that maximises your bathroom space while creating a stunning shower zone. Features robust chrome hardware and precision-engineered panels.

**Glass Options & Pricing (per sq.ft):**
• Clear Glass — ₹649/sqft
• Frosted Glass — ₹749/sqft
• Fluted Glass — ₹999/sqft
• Lacquered Glass — ₹1,399/sqft

**Available Finishes:** Chrome Glossy, Black Matte, Gold Glossy, Rosegold Glossy

**Hydrophobic Coating Add-on:** ₹85/sqft

Enter your required glass area (in sq.ft) as quantity at checkout. Minimum order 20 sqft.`,
      price: 649,
      compareAtPrice: 849,
      costPrice: 400,
      category: showerCat._id,
      subCategory: 'L-Shape',
      images: makeImages(lshapeChromeAll, lshapeGoldClear),
      variants: [
        {
          name: 'Finish',
          options: [
            { label: 'Chrome Glossy', value: 'chrome-glossy', priceModifier: 0 },
            { label: 'Gold Glossy', value: 'gold-glossy', priceModifier: 0 },
            { label: 'Black Matte', value: 'black-matte', priceModifier: 0 },
            { label: 'Rosegold Glossy', value: 'rosegold-glossy', priceModifier: 0 },
          ],
        },
        {
          name: 'Glass Type',
          options: [
            { label: 'Clear Glass', value: 'clear', priceModifier: 0 },
            { label: 'Frosted Glass', value: 'frosted', priceModifier: 100 },
            { label: 'Fluted Glass', value: 'fluted', priceModifier: 350 },
            { label: 'Lacquered Glass', value: 'lacquered', priceModifier: 750 },
          ],
        },
      ],
      specifications: [
        { key: 'Price Unit', value: 'Per Square Foot (SQFT)' },
        { key: 'Glass Thickness', value: '8mm Toughened Safety Glass' },
        { key: 'Hardware Finish', value: 'Chrome Glossy' },
        { key: 'Configuration', value: 'L-Shape Corner' },
        { key: 'Min Order', value: '20 SQFT' },
        { key: 'Lead Time', value: '10–14 working days' },
        { key: 'Warranty', value: '5 Years on Hardware' },
      ],
      badges: ['best-seller'],
      stock: 999,
      trackInventory: false,
      isActive: true,
      isFeatured: true,
      avgRating: 4.8, reviewCount: 0, salesCount: 0,
      tags: ['shower', 'l-shape', 'corner', 'chrome', 'premium', 'custom'],
    },

    // ────────────────────────────────────────────────
    // 5. L-SHAPE DOUBLE DOOR
    // ────────────────────────────────────────────────
    {
      name: 'L-Shape Double Door Shower Enclosure',
      slug: 'lshape-double-door-shower-enclosure',
      sku: 'OZO-LSE-DD-001',
      brand: 'OZOBATH',
      shortDescription: 'Premium L-shape enclosure with swing & sliding double door combination. Priced per square foot.',
      description: `The ultimate shower enclosure — an L-shape design with a unique combination of swing and sliding doors. This double-door configuration provides flexible entry options and a truly premium bathing experience.

**Glass Options & Pricing (per sq.ft):**
• Clear Glass — ₹699/sqft
• Frosted Glass — ₹789/sqft
• Fluted Glass — ₹1,049/sqft
• Lacquered Glass — ₹1,559/sqft

**Available Finishes:** Chrome Glossy, Black Matte, Gold Glossy, Rosegold Glossy

**Hydrophobic Coating Add-on:** ₹85/sqft

Enter your required glass area (in sq.ft) as quantity at checkout. Minimum order 25 sqft.`,
      price: 699,
      compareAtPrice: 899,
      costPrice: 450,
      category: showerCat._id,
      subCategory: 'L-Shape Double Door',
      images: makeImages(lshapeChromeAll, lshapeGoldClear),
      variants: [
        {
          name: 'Finish',
          options: [
            { label: 'Chrome Glossy', value: 'chrome-glossy', priceModifier: 0 },
            { label: 'Gold Glossy', value: 'gold-glossy', priceModifier: 0 },
            { label: 'Black Matte', value: 'black-matte', priceModifier: 0 },
            { label: 'Rosegold Glossy', value: 'rosegold-glossy', priceModifier: 0 },
          ],
        },
        {
          name: 'Glass Type',
          options: [
            { label: 'Clear Glass', value: 'clear', priceModifier: 0 },
            { label: 'Frosted Glass', value: 'frosted', priceModifier: 90 },
            { label: 'Fluted Glass', value: 'fluted', priceModifier: 350 },
            { label: 'Lacquered Glass', value: 'lacquered', priceModifier: 860 },
          ],
        },
      ],
      specifications: [
        { key: 'Price Unit', value: 'Per Square Foot (SQFT)' },
        { key: 'Glass Thickness', value: '8mm Toughened Safety Glass' },
        { key: 'Door Type', value: 'Swing + Sliding (Double Door)' },
        { key: 'Configuration', value: 'L-Shape' },
        { key: 'Min Order', value: '25 SQFT' },
        { key: 'Lead Time', value: '10–14 working days' },
        { key: 'Warranty', value: '5 Years on Hardware' },
      ],
      badges: ['featured', 'new'],
      stock: 999,
      trackInventory: false,
      isActive: true,
      isFeatured: true,
      avgRating: 0, reviewCount: 0, salesCount: 0,
      tags: ['shower', 'l-shape', 'double-door', 'premium', 'custom'],
    },

    // ────────────────────────────────────────────────
    // 6. HYDROPHOBIC COATING — SHOWER ENCLOSURE
    // ────────────────────────────────────────────────
    {
      name: 'Hydrophobic Coating — Shower Enclosure',
      slug: 'hydrophobic-coating-shower-enclosure',
      sku: 'OZO-HYD-SHW-001',
      brand: 'OZOBATH',
      shortDescription: 'Professional hydrophobic nano-coating for shower enclosure glass. ₹85 per sqft.',
      description: `Professional-grade hydrophobic nano-coating applied to your shower enclosure glass. Creates an invisible water-repelling surface that prevents limescale, soap scum and mineral deposits.

**Benefits:**
• Water beads and slides off instantly
• Up to 3× easier to clean
• Protects against hard water stains
• Extends the life of your glass
• Odourless, non-toxic formula

**Pricing:** ₹85 per square foot
Enter your glass area (in sq.ft) as quantity at checkout.`,
      price: 85,
      compareAtPrice: 120,
      costPrice: 40,
      category: sanitaryCat._id,
      images: makeImages(partialFrosted1),
      specifications: [
        { key: 'Application Area', value: 'Shower Enclosure Glass' },
        { key: 'Price Unit', value: 'Per Square Foot (SQFT)' },
        { key: 'Durability', value: '2–3 years with regular cleaning' },
        { key: 'Application', value: 'Professional spray application' },
      ],
      badges: ['best-seller'],
      stock: 999,
      trackInventory: false,
      isActive: true,
      tags: ['coating', 'hydrophobic', 'glass-protection', 'maintenance'],
    },

    // ────────────────────────────────────────────────
    // 7. HYDROPHOBIC COATING — SANITARY
    // ────────────────────────────────────────────────
    {
      name: 'Hydrophobic Coating — Sanitary Bathroom Set',
      slug: 'hydrophobic-coating-sanitary-set',
      sku: 'OZO-HYD-SAN-001',
      brand: 'OZOBATH',
      shortDescription: 'Full bathroom sanitary hydrophobic treatment. ₹3,999 per bathroom set.',
      description: `Complete hydrophobic coating treatment for your entire bathroom sanitary set including WC, washbasin, bathtub and other ceramic surfaces. Protects against staining, bacteria, and water marks.

**Includes treatment for:** WC pan, cistern, washbasin, bathtub/shower tray
**Pricing:** ₹3,999 per bathroom set (fixed price, not per sqft)
**Duration:** 2–3 years protection`,
      price: 3999,
      compareAtPrice: 5499,
      costPrice: 2000,
      category: sanitaryCat._id,
      images: makeImages(sanitaryBasin1, sanitaryBasin2),
      specifications: [
        { key: 'Coverage', value: 'Full bathroom sanitary set' },
        { key: 'Durability', value: '2–3 years' },
        { key: 'Application', value: 'Professional service' },
      ],
      badges: [],
      stock: 999,
      trackInventory: false,
      isActive: true,
      tags: ['coating', 'hydrophobic', 'sanitary', 'bathroom'],
    },

    // ────────────────────────────────────────────────
    // 8. OZO STAIN REMOVER
    // ────────────────────────────────────────────────
    {
      name: 'OZO Stain Remover',
      slug: 'ozo-stain-remover',
      sku: 'OZO-SAN-SRM-001',
      brand: 'OZOBATH',
      shortDescription: 'Professional-grade glass and ceramic stain remover. ₹299 per bottle.',
      description: `OZOBATH's professional stain remover formula cuts through hard water deposits, limescale, soap scum, and mineral stains on glass shower enclosures and ceramic surfaces.

**Effective on:**
• Shower enclosure glass
• Chrome and gold fittings
• Ceramic tiles and sanitary ware
• Stainless steel surfaces

**Directions:** Apply, leave for 2 minutes, wipe clean. No abrasives. pH-balanced formula.`,
      price: 299,
      compareAtPrice: 399,
      costPrice: 120,
      category: sanitaryCat._id,
      images: makeImages(sanitaryFaucet),
      specifications: [
        { key: 'Volume', value: '500ml' },
        { key: 'Formula', value: 'pH-balanced, non-abrasive' },
        { key: 'Safe For', value: 'Glass, Chrome, Gold, Ceramic, SS' },
      ],
      badges: ['best-seller', 'new'],
      stock: 500,
      trackInventory: true,
      isActive: true,
      tags: ['stain-remover', 'cleaning', 'maintenance', 'glass', 'bathroom'],
    },

    // ────────────────────────────────────────────────
    // 9. OZObath SHOWER KIT
    // ────────────────────────────────────────────────
    {
      name: 'OZObath Shower Kit',
      slug: 'ozobath-shower-kit',
      sku: 'OZO-SAN-KIT-001',
      brand: 'OZOBATH',
      shortDescription: 'Complete shower maintenance and care kit. ₹899.',
      description: `Everything you need to keep your OZOBATH shower enclosure looking pristine. The complete shower maintenance kit includes professional-grade cleaning and protection products.

**Kit Contents:**
• OZO Stain Remover (500ml)
• Hydrophobic coating spray (spray bottle)
• Microfibre cleaning cloth (2 pcs)
• Rubber squeegee
• Usage guide

**Recommended:** Use weekly for best results. Compatible with all OZOBATH shower enclosures.`,
      price: 899,
      compareAtPrice: 1299,
      costPrice: 450,
      category: sanitaryCat._id,
      images: makeImages(sanitaryFaucet, sanitaryBasin1),
      specifications: [
        { key: 'Contents', value: 'Stain remover + Coating spray + Cloth + Squeegee' },
        { key: 'Compatible', value: 'All OZOBATH shower enclosures' },
        { key: 'Recommended Use', value: 'Weekly maintenance' },
      ],
      badges: ['new', 'best-seller'],
      stock: 200,
      trackInventory: true,
      isActive: true,
      isFeatured: true,
      tags: ['shower-kit', 'maintenance', 'cleaning', 'accessories'],
    },
  ]);

  console.log('\n✅ All 9 OZOBATH products created successfully!\n');
  console.log('📋 Summary:');
  console.log('   • Partial Shower Enclosure — Rosegold Glossy');
  console.log('   • Sliding Shower Enclosure — Gold Glossy');
  console.log('   • Swing Shower Enclosure — Black Matte');
  console.log('   • L-Shape Shower Enclosure — Chrome Glossy');
  console.log('   • L-Shape Double Door Shower Enclosure');
  console.log('   • Hydrophobic Coating — Shower Enclosure (₹85/sqft)');
  console.log('   • Hydrophobic Coating — Sanitary Set (₹3,999)');
  console.log('   • OZO Stain Remover (₹299)');
  console.log('   • OZObath Shower Kit (₹899)\n');

  process.exit(0);
};

productSeed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
