/**
 * socket.js
 * ─────────
 * Socket.IO server setup with authentication and room management.
 * Users join rooms based on their user_id so they only receive
 * updates for their own orders.
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const service = require('./modules/orders/orders.service');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

let io;

/**
 * Initialise Socket.IO on the given HTTP server.
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // ──── Authentication middleware ────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      // Allow connection without auth (guest), but don't assign user
      socket.user = null;
      return next();
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      // Still allow connection, but without auth
      socket.user = null;
      next();
    }
  });

  // ──── Connection handler ──────────────────────────────────────
  io.on('connection', (socket) => {
    const user = socket.user;

    if (user) {
      // Join a private room for this user so they receive their own updates
      socket.join(`user_${user.id}`);
      console.log(`🔌 Socket connected: user_${user.id} (${user.role})`);

      // Admin joins a special admin room for broadcast updates
      if (user.role === 'admin') {
        socket.join('admin_room');
        console.log(`   👑 Admin joined admin_room`);
      }
    } else {
      console.log(`🔌 Socket connected: anonymous`);
    }

    // ── Join a specific order room (for any user tracking a specific order)
    socket.on('joinOrderRoom', (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`   📦 Socket joined order_${orderId}`);
    });

    // ── Delivery Location Updates (Real-time mapping)
    socket.on('updateDeliveryLocation', async ({ orderId, lat, lng }) => {
      // Persist to database so it survives refreshes
      try {
        await service.updateOrderLocation(orderId, lat, lng);
      } catch (err) {
        console.error('Failed to persist location:', err.message);
      }

      // Broadcast location to everyone in the order_ room (customer + admins)
      io.to(`order_${orderId}`).emit('deliveryLocationUpdate', {
        order_id: orderId,
        coords: { lat, lng },
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      if (user) {
        console.log(`🔌 Socket disconnected: user_${user.id}`);
      }
    });
  });

  return io;
};

/**
 * Get the Socket.IO instance (for use in controllers).
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialised – call initSocket first.');
  }
  return io;
};

module.exports = { initSocket, getIO };
