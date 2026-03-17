const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, 'apps/server/.env') });
const connectDB = require('./apps/server/src/config/db');
const Product = require('./apps/server/src/models/Product');

const updateProducts = async () => {
    try {
        await connectDB();
        const products = await Product.find({});

        // Fallback dictionary for known existing local images
        const imageMap = {
            'crystal-clear-frameless-shower': '/images/promo_shower_enclosure.png',
            'matte-black-sliding-door': '/images/promo_sliding_door.png',
            'neo-angle-corner-shower': '/images/product_shower_1.png',
            'stainless-steel-towel-rack': 'https://loremflickr.com/800/800/towel,rack,bathroom',
            'premium-glass-shelf-guard-rail': 'https://loremflickr.com/800/800/shelf,bathroom,glass',
            'luxe-waterfall-basin-faucet': 'https://loremflickr.com/800/800/faucet,gold,bathroom',
            'minimalist-chrome-pillar-tap': 'https://loremflickr.com/800/800/faucet,chrome,bathroom',
            'sensor-touch-smart-faucet': 'https://loremflickr.com/800/800/faucet,smart,bathroom',
            'artisan-single-lever-basin-mixer': 'https://loremflickr.com/800/800/mixer,faucet,bathroom',
            'rose-gold-tall-basin-mixer': 'https://loremflickr.com/800/800/faucet,rosegold,bathroom'
        };

        for (const p of products) {
            const imgUrl = imageMap[p.slug] || `https://loremflickr.com/800/800/bathroom,${p.slug.split('-')[0]}`;
            p.images = [{ url: imgUrl, alt: p.name }];
            await p.save();
            console.log(`Updated ${p.name} with image: ${imgUrl}`);
        }

        console.log('✅ Successfully mapped products to available placeholders and local images!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error updating DB:', err);
        process.exit(1);
    }
};

updateProducts();
