/**
 * orders.routes.js
 * ────────────────
 * Route definitions for order module.
 */

const express = require('express');
const router = express.Router();
const controller = require('./orders.controller');
const { authenticate, authorize } = require('../../shared/middleware/auth');

// Allow users to place orders (requires login to link user ID)
router.post('/', authenticate, controller.placeOrder);

// User: Fetch personal order history
router.get('/my-orders', authenticate, controller.getMyOrders);

// Admin routes
router.get('/all', authenticate, authorize('admin'), controller.getAllOrders);
router.post('/assign', authenticate, authorize('admin'), controller.assignOrder);
router.get('/delivery-personnel', authenticate, authorize('admin'), controller.getDeliveryPersonnel);
router.delete('/:id', authenticate, authorize('admin'), controller.cancelOrder);

// Delivery & Admin: Update status
router.patch('/:id/status', authenticate, controller.updateOrderStatus);

// Delivery personnel routes
router.get('/assigned', authenticate, authorize('delivery'), controller.getAssignedOrders);

module.exports = router;
