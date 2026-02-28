const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Banner = require('../src/models/Banner');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const images = [
  {
    file: 'C:\\Users\\Tariq\\.gemini\\antigravity\\brain\\116370d4-069f-47a3-8a46-7eba76813b11\\hero_shower_1772273097208.png',
    title: 'Make Your Bathroom Unique & Modern',
    page: 'home', position: 'hero', linkUrl: '/shop'
  },
  {
    file: 'C:\\Users\\Tariq\\.gemini\\antigravity\\brain\\116370d4-069f-47a3-8a46-7eba76813b11\\sliding_black_matte_1772273110898.png',
    title: 'Sliding Standard Black Matte',
    page: 'home', position: 'sidebar', linkUrl: '/shop'
  },
  {
    file: 'C:\\Users\\Tariq\\.gemini\\antigravity\\brain\\116370d4-069f-47a3-8a46-7eba76813b11\\l_shape_rosegold_1772273124882.png',
    title: 'L-Shape Rosegold',
    page: 'home', position: 'promo', linkUrl: '/shop'
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    await Banner.deleteMany({});
    
    // Create actual banners
    for (const img of images) {
      console.log('Uploading:', img.title);
      const result = await cloudinary.uploader.upload(img.file, { folder: 'ozobath/banners' });
      await Banner.create({
        title: img.title,
        image: { url: result.secure_url },
        link: img.linkUrl,
        page: img.page,
        position: img.position,
        isActive: true
      });
      console.log('Created Banner:', img.title);
    }
    
    console.log('Seeding done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seed();
