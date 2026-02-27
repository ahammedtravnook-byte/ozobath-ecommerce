// ============================================
// OZOBATH - Server Entry Point
// ============================================
const app = require('./src/app');
const connectDB = require('./src/config/db');
const env = require('./src/config/env');

const PORT = env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start server
    const server = app.listen(PORT, () => {
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

startServer();
