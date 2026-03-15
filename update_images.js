const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, 'apps/server/.env') });

const connectDB = require('./apps/server/src/config/db');
const Product = require('./apps/server/src/models/Product');

const updateProductImages = async () => {
    try {
        await connectDB();
        console.log('Fetching all products...');

        const products = await Product.find({});

        console.log(`Found ${products.length} products. Updating image URLs to match names/slugs...`);

        for (const product of products) {
            // Create a URL based on the slug, e.g., /images/products/sensor-touch-smart-faucet.png
            const imageUrl = `/images/products/${product.slug}.png`;

            product.images = [
                {
                    url: imageUrl,
                    alt: product.name,
                }
            ];

            await product.save();
            console.log(`Updated ${product.sku}: ${product.name} -> ${imageUrl}`);
        }

        console.log('✅ All product images updated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Update failed:', error.message);
        process.exit(1);
    }
};

updateProductImages();
