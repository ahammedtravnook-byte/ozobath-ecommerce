const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, 'apps/server/.env') });
const connectDB = require('./apps/server/src/config/db');

// Models
const Order = require('./apps/server/src/models/Order');

const cleanDatabase = async () => {
    try {
        await connectDB();
        console.log('Cleaning old Orders from database...');
        if (Order) {
            const res = await Order.deleteMany({});
            console.log(`Deleted ${res.deletedCount} old orders.`);
        }
        process.exit(0);
    } catch (err) {
        console.error('Error cleaning DB:', err);
        process.exit(1);
    }
}

cleanDatabase();
