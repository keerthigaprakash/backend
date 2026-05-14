/**
 * orders.controller.js
 * ────────────────────
 * Route handlers for order operations.
 */

const service = require('./orders.service');

/**
 * POST /api/orders
 */
const placeOrder = async (req, res) => {
  try {
    // user_id can come from the authenticated user (req.user)
    // or be null for guest checkout (if we allow it).
    const user_id = req.user ? req.user.id : null;
    
    const orderData = {
      user_id,
      ...req.body // expected: { items: [], total: 100, shipping_info: {} }
    };

    const order = await service.placeOrder(orderData);
    
    res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      data: order
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to place order.'
    });
  }
};

/**
 * GET /api/orders/my-orders
 */
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await service.getUserOrders(userId);
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: 'Failed to fetch orders.'
    });
  }
};

/**
 * GET /api/orders/all
 * Admin only
 */
const getAllOrders = async (req, res) => {
  try {
    const orders = await service.getAllOrders();
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: 'Failed to fetch all orders.'
    });
  }
};

/**
 * POST /api/orders/assign
 * Admin only
 */
const assignOrder = async (req, res) => {
  try {
    const { orderId, deliveryPersonId } = req.body;
    const order = await service.assignOrder(orderId, deliveryPersonId);
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to assign order.' });
  }
};

/**
 * GET /api/orders/delivery-personnel
 * Admin only
 */
const getDeliveryPersonnel = async (req, res) => {
  try {
    const personnel = await service.getDeliveryPersonnel();
    res.json({ success: true, data: personnel });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch personnel.' });
  }
};

/**
 * GET /api/orders/assigned
 * For delivery personnel
 */
const getAssignedOrders = async (req, res) => {
  try {
    const orders = await service.getAssignedOrders(req.user.id);
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch assigned orders.' });
  }
};

/**
 * DELETE /api/orders/:id
 * Admin only
 */
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    await service.cancelOrder(id);
    res.json({ success: true, message: 'Order canceled successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel order.' });
  }
};

/**
 * PATCH /api/orders/:id/status
 * Admin only – updates order status and emits real-time event.
 */
const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    // Update status in DB
    const updatedOrder = await service.updateOrderStatus(orderId, status);

    // Fetch full order details for the socket event
    const fullOrder = await service.getOrderById(orderId);

    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    if (io && fullOrder) {
      // Send to the specific user's room
      if (fullOrder.user_id) {
        io.to(`user_${fullOrder.user_id}`).emit('orderStatusUpdate', {
          order_id: fullOrder.id,
          status: status,
          order: fullOrder,
        });
      }

      // Also emit to the order-specific room (for anyone tracking this order)
      io.to(`order_${orderId}`).emit('orderStatusUpdate', {
        order_id: fullOrder.id,
        status: status,
        order: fullOrder,
      });

      // Notify all admins
      io.to('admin_room').emit('orderStatusUpdate', {
        order_id: fullOrder.id,
        status: status,
        order: fullOrder,
      });
    }

    res.json({
      success: true,
      message: `Order #${orderId} status updated to "${status}".`,
      data: updatedOrder,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update order status.',
    });
  }
};

module.exports = {
  placeOrder,
  getMyOrders,
  getAllOrders,
  assignOrder,
  updateOrderStatus,
  getDeliveryPersonnel,
  getAssignedOrders,
  cancelOrder,
};
