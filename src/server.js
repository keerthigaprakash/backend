/**
 * server.js
 * ─────────
 * Entry point – loads env vars, initialises the database, creates
 * an HTTP server, attaches Socket.IO, and starts listening.
 */

require('dotenv').config();

const http = require('http');
const app = require('./app');
const { initDB } = require('./config/db');
const { initSocket } = require('./socket');

// Parse port from environment variables (Render sets PORT automatically)
const PORT = parseInt(process.env.PORT, 10) || 5000;

const start = async () => {
  // Initialise DB separately so a connection failure doesn't block the server
  try {
    await initDB();
  } catch (dbError) {
    console.error('⚠️ Database initialization failed:', dbError.message || dbError);
    if (dbError.stack) {
      console.error(dbError.stack);
    }
  }

  // Create HTTP server from Express app
  const server = http.createServer(app);

  // Attach Socket.IO to the same HTTP server
  const io = initSocket(server);

  // Make io accessible to routes via app.locals
  app.set('io', io);

  // Handle port-in-use error gracefully instead of crashing
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Please free the port and restart.`);
      process.exit(1);
    } else {
      console.error('❌ Server error:', err.message);
      process.exit(1);
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🌸 Bloom & Bliss API server running on http://0.0.0.0:${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Health check: http://0.0.0.0:${PORT}/api/health`);
    console.log(`   🔌 WebSocket: ws://0.0.0.0:${PORT}\n`);
  });
};

start();
