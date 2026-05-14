/**
 * orders.model.js
 * ───────────────
 * Data‑access layer for order management.
 */

const { pool } = require('../../config/db');

/**
 * Creates a new order and its associated items in a single transaction.
 */
const createOrder = async ({ user_id, total, items, shipping_info }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create the order entry
    const orderRes = await client.query(
      'INSERT INTO orders (user_id, total, shipping_info, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id || null, total, shipping_info || null, 'pending']
    );
    const order = orderRes.rows[0];

    // Create the order items
    for (const item of items) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [order.id, item.product_id || null, item.quantity, item.price]
      );
    }

    await client.query('COMMIT');
    return order;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getOrdersByUserId = async (userId) => {
  const { rows } = await pool.query(`
    SELECT 
      o.id,
      o.total,
      o.shipping_info,
      o.status,
      o.created_at,
      o.current_lat,
      o.current_lng,
      json_agg(
        json_build_object(
          'product_id', i.product_id,
          'quantity', i.quantity,
          'price', i.price,
          'product_name', p.name,
          'product_image', p.image_key
        )
      ) as items
    FROM orders o
    LEFT JOIN order_items i ON o.id = i.order_id
    LEFT JOIN products p ON i.product_id = p.id
    WHERE o.user_id = $1
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `, [userId]);
  return rows;
};

/**
 * Get all orders along with their items and associated product info (admin only).
 */
const getAllOrders = async () => {
  const { rows } = await pool.query(`
    SELECT 
      o.id,
      o.total,
      o.shipping_info,
      o.status,
      o.created_at,
      o.current_lat,
      o.current_lng,
      o.delivery_person_id,
      u.name as customer_name,
      u.email as customer_email,
      json_agg(
        json_build_object(
          'product_id', i.product_id,
          'quantity', i.quantity,
          'price', i.price,
          'product_name', p.name,
          'product_image', p.image_key
        )
      ) as items
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN order_items i ON o.id = i.order_id
    LEFT JOIN products p ON i.product_id = p.id
    GROUP BY o.id, u.name, u.email
    ORDER BY o.created_at DESC
  `);
  return rows;
};

/**
 * Update order assignment (Admin only).
 */
const updateOrderAssignment = async (orderId, deliveryPersonId) => {
  const { rows } = await pool.query(
    'UPDATE orders SET delivery_person_id = $1, status = $2 WHERE id = $3 RETURNING *',
    [deliveryPersonId, 'shipped', orderId]
  );
  return rows[0];
};

/**
 * Update order status.
 */
const updateOrderStatus = async (orderId, status) => {
  const { rows } = await pool.query(
    'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
    [status, orderId]
  );
  return rows[0] || null;
};

/**
 * Fetch all users with role 'delivery'.
 */
const getDeliveryPersonnel = async () => {
  const { rows } = await pool.query(
    "SELECT id, name, email FROM users WHERE role = 'delivery' ORDER BY name"
  );
  return rows;
};

/**
 * Get orders assigned to a specific delivery person.
 */
const getAssignedOrders = async (deliveryPersonId) => {
  const { rows } = await pool.query(`
    SELECT 
      o.id,
      o.total,
      o.shipping_info,
      o.status,
      o.created_at,
      o.current_lat,
      o.current_lng,
      u.name as customer_name,
      u.email as customer_email,
      json_agg(
        json_build_object(
          'product_id', i.product_id,
          'quantity', i.quantity,
          'price', i.price,
          'product_name', p.name,
          'product_image', p.image_key
        )
      ) as items
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN order_items i ON o.id = i.order_id
    LEFT JOIN products p ON i.product_id = p.id
    WHERE o.delivery_person_id = $1
    GROUP BY o.id, u.name, u.email
    ORDER BY o.created_at DESC
  `, [deliveryPersonId]);
  return rows;
};

/**
 * Get a single order with its items (for emitting to the user).
 */
const getOrderById = async (orderId) => {
  const { rows } = await pool.query(
    `SELECT 
      o.id,
      o.user_id,
      o.total,
      o.shipping_info,
      o.status,
      o.created_at,
      o.current_lat,
      o.current_lng,
      u.name as customer_name,
      u.email as customer_email,
      json_agg(
        json_build_object(
          'product_id', i.product_id,
          'quantity', i.quantity,
          'price', i.price,
          'product_name', p.name,
          'product_image', p.image_key
        )
      ) as items
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN order_items i ON o.id = i.order_id
    LEFT JOIN products p ON i.product_id = p.id
    WHERE o.id = $1
    GROUP BY o.id, u.name, u.email`,
    [orderId]
  );
  return rows[0] || null;
};

/**
 * Update current delivery location coordinates.
 */
const updateOrderLocation = async (orderId, lat, lng) => {
  await pool.query(
    'UPDATE orders SET current_lat = $1, current_lng = $2 WHERE id = $3',
    [lat, lng, orderId]
  );
};

/**
 * Delete/Cancel an order (Admin only).
 */
const deleteOrder = async (orderId) => {
  await pool.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
  const { rowCount } = await pool.query('DELETE FROM orders WHERE id = $1', [orderId]);
  return rowCount > 0;
};

module.exports = {
  createOrder,
  getOrdersByUserId,
  getAllOrders,
  updateOrderAssignment,
  updateOrderStatus,
  getDeliveryPersonnel,
  getAssignedOrders,
  getOrderById,
  updateOrderLocation,
  deleteOrder,
};
