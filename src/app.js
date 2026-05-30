/**
 * app.js
 * ──────
 * Express application setup – middleware, routes, and error handling.
 * Exported so that server.js just does `app.listen(...)`.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const homeRoutes = require('./modules/home/home.routes');
const orderRoutes = require('./modules/orders/orders.routes');

const app = express();

/* ──── Global middleware ──────────────────────────────────────────── */

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests from any localhost port (dev) or no origin (Postman / same-origin)
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }
    // Production: allow the Render frontend URL if set
    const allowedOrigins = [
      'https://backend-4qls.onrender.com',
      process.env.FRONTEND_URL,
    ].filter(Boolean);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger (development)
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method}  ${req.originalUrl}`);
  next();
});

// Serve frontend uploads locally
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

/* ──── Routes ─────────────────────────────────────────────────────── */

// Root Welcome Message
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the Bloom & Bliss Backend 🌸',
    status: 'Operational',
    healthCheck: '/api/health'
  });
});

// Health‑check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Bloom & Bliss API is running 🌸' });
});

// Home / Products module
app.use('/api/home', homeRoutes);

// Orders module
app.use('/api/orders', orderRoutes);

/* ──── 404 handler ────────────────────────────────────────────────── */

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

/* ──── Global error handler ───────────────────────────────────────── */

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error.',
  });
});

module.exports = app;
