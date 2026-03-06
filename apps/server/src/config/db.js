// ============================================
// OZOBATH - MongoDB Connection (Resilient)
// ============================================
const mongoose = require('mongoose');
const dns = require('dns');
const env = require('./env');

// Force IPv4 first — fixes connectivity on captive portal / restricted networks
dns.setDefaultResultOrder('ipv4first');

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 3000; // 3 seconds
let retryCount = 0;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoSelectFamily: false,
      serverSelectionTimeoutMS: 10000,
      heartbeatFrequencyMS: 30000,
      socketTimeoutMS: 45000,
    });
    retryCount = 0; // Reset on successful connection
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);

    if (retryCount < MAX_RETRIES) {
      retryCount++;
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount - 1);
      console.log(`🔄 Retrying connection (${retryCount}/${MAX_RETRIES}) in ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectDB(); // Recursive retry
    }

    console.error(`💀 All ${MAX_RETRIES} connection attempts failed. Exiting.`);
    process.exit(1);
  }
};

// Auto-reconnect on disconnect
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting reconnect...');
  retryCount = 0; // Reset for reconnect attempts
  setTimeout(() => connectDB(), INITIAL_RETRY_DELAY);
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB error: ${err.message}`);
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected successfully');
});

module.exports = connectDB;
