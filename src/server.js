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

const PORT = parseInt(process.env.PORT, 10) || 5000;

const start = async () => {
  try {
    // Create tables if they don't exist yet
    await initDB();

    // Create HTTP server from Express app
    const server = http.createServer(app);

    // Attach Socket.IO to the same HTTP server
    const io = initSocket(server);

    // Make io accessible to routes via app.locals
    app.set('io', io);

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🌸 Bloom & Bliss API server running on http://0.0.0.0:${PORT}`);
      console.log(`   Local network: http://10.186.83.37:${PORT}`);
      console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Health check: http://10.186.83.37:${PORT}/api/health`);
      console.log(`   🔌 WebSocket: ws://10.186.83.37:${PORT}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

start();
