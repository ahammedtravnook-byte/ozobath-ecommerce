// ============================================
// OZOBATH - Server Entry Point
// ============================================
const app = require('./src/app');
const connectDB = require('./src/config/db');
const env = require('./src/config/env');

const PORT = env.PORT || 5000;

// Module-scoped so the crash handlers below can close it gracefully.
let server;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Raise the order-number counter above any existing orders, so switching
    // from the old countDocuments() scheme does not restart numbering at 1.
    require('./src/models/Order');
    const { seedOrderCounter } = require('./src/models/Counter');
    await seedOrderCounter();

    // Start server
    server = app.listen(PORT, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════════╗');
      console.log('║        🚿 OZOBATH API SERVER                ║');
      console.log('╠══════════════════════════════════════════════╣');
      console.log(`║  Environment : ${env.NODE_ENV.padEnd(29)}║`);
      console.log(`║  Port        : ${String(PORT).padEnd(29)}║`);
      console.log(`║  Client URL  : ${env.CLIENT_URL.padEnd(29)}║`);
      console.log(`║  Admin URL   : ${env.ADMIN_URL.padEnd(29)}║`);
      console.log('╚══════════════════════════════════════════════╝');
      console.log('');
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log('✅ Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// ─── Fatal Error Handling ────────────────────────────
// Node terminates the process on an unhandled rejection by default, so a single
// missed .catch() in a Razorpay/Cloudinary call would drop the API. We stop
// accepting new connections, let in-flight requests finish, then exit non-zero
// so PM2 restarts a clean process.
const shutdownOnFatal = (label, err) => {
  console.error(`\n💥 ${label} — shutting down:`);
  console.error(err);

  if (!server) process.exit(1);

  // Force exit if graceful close hangs (e.g. a stuck keep-alive socket).
  const forceExit = setTimeout(() => {
    console.error('⏱️  Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10000);
  forceExit.unref();

  server.close(() => {
    clearTimeout(forceExit);
    process.exit(1);
  });
};

process.on('unhandledRejection', (err) => shutdownOnFatal('UNHANDLED REJECTION', err));

// An uncaught exception leaves the process in an undefined state — exit
// immediately rather than risk serving corrupted responses.
process.on('uncaughtException', (err) => {
  console.error('\n💥 UNCAUGHT EXCEPTION — exiting immediately:');
  console.error(err);
  process.exit(1);
});

startServer();
