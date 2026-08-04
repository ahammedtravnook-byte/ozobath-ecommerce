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

// Guard against overlapping retry loops. The 'disconnected' event fires during
// a failed connect attempt, so without this the handler would spawn a second
// connectDB() racing the one already retrying — both sharing (and resetting)
// retryCount, which made MAX_RETRIES never actually cap anything.
let isConnecting = false;

// ─── Slow Query Logging ──────────────────────────
// Uses the driver's command monitoring, which reports the actual server-side
// duration of each operation. (Mongoose's `debug` hook fires when a query is
// ISSUED, not when it completes, so it cannot measure duration.)
//
// A query over the threshold is logged with its collection and shape — enough
// to spot a missing index without the noise of full query logging.
const SLOW_QUERY_MS = parseInt(process.env.SLOW_QUERY_MS, 10) || 300;

const MONITORED = new Set(['find', 'aggregate', 'count', 'distinct', 'update', 'delete', 'findAndModify', 'insert']);

const enableSlowQueryLogging = (client) => {
  if (!client || typeof client.on !== 'function') return;

  client.on('commandSucceeded', (event) => {
    if (!MONITORED.has(event.commandName)) return;
    if (event.duration < SLOW_QUERY_MS) return;
    console.warn(`🐢 Slow query ${event.duration}ms — ${event.commandName} on ${event.address || 'db'}`);
  });

  client.on('commandFailed', (event) => {
    if (!MONITORED.has(event.commandName)) return;
    console.error(`❌ Query failed after ${event.duration}ms — ${event.commandName}: ${event.failure?.message || 'unknown'}`);
  });
};

const connectDB = async () => {
  if (isConnecting) return; // A retry loop is already in flight
  isConnecting = true;

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoSelectFamily: false,
      serverSelectionTimeoutMS: 10000,
      heartbeatFrequencyMS: 30000,
      socketTimeoutMS: 45000,
      // Required for the slow-query listeners below.
      monitorCommands: true,
    });

    enableSlowQueryLogging(conn.connection.getClient());

    // mongoose.connect() can resolve without a usable connection. Only report
    // success once the connection is genuinely open (readyState 1), otherwise
    // PM2 logs would show "✅ Connected" while the API is actually down.
    if (conn.connection.readyState !== 1 || !conn.connection.host) {
      throw new Error('Connection resolved but is not open (readyState !== 1)');
    }

    retryCount = 0; // Reset on successful connection
    isConnecting = false;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);

    if (retryCount < MAX_RETRIES) {
      retryCount++;
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount - 1);
      console.log(`🔄 Retrying connection (${retryCount}/${MAX_RETRIES}) in ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      isConnecting = false; // Release before recursing so the guard stays accurate
      return connectDB(); // Recursive retry
    }

    isConnecting = false;
    console.error(`💀 All ${MAX_RETRIES} connection attempts failed. Exiting.`);
    process.exit(1);
  }
};

// Auto-reconnect on disconnect
mongoose.connection.on('disconnected', () => {
  // Silent while a retry loop owns reconnection — otherwise every failed
  // attempt logs a misleading "disconnected" warning.
  if (isConnecting) return;

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
