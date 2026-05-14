/**
 * home.model.js
 * Data-access layer for products & users
 */

const { pool } = require('../../config/db');

/* ────────────────────────────── Products ────────────────────────────── */

const getAllProducts = async (category) => {
  try {
    let query = 'SELECT *, image_key AS image FROM products';
    const params = [];

    if (category && category !== 'all') {
      query += ' WHERE category = $1';
      params.push(category);
    }

    query += ' ORDER BY id ASC';

    const { rows } = await pool.query(query, params);
    return rows;
  } catch (err) {
    console.error('Error fetching products:', err);
    throw err;
  }
};

const getFeaturedProducts = async () => {
  try {
    const { rows } = await pool.query(
      'SELECT *, image_key AS image FROM products ORDER BY created_at DESC LIMIT 12'
    );
    return rows;
  } catch (err) {
    console.error('Error fetching featured products:', err);
    throw err;
  }
};

const getProductById = async (id) => {
  try {
    const { rows } = await pool.query(
      'SELECT *, image_key AS image FROM products WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  } catch (err) {
    console.error('Error fetching product by ID:', err);
    throw err;
  }
};

const createProduct = async ({
  name,
  price,
  category,
  description,
  image_key,
  features,
}) => {
  try {
    const { rows } = await pool.query(
      `INSERT INTO products 
      (name, price, category, description, image_key, features)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        name,
        price,
        category,
        description || '',
        image_key || '',
        JSON.stringify(features || []), // safer
      ]
    );
    return rows[0];
  } catch (err) {
    console.error('Error creating product:', err);
    throw err;
  }
};

const updateProduct = async (id, fields) => {
  try {
    const allowed = [
      'name',
      'price',
      'category',
      'description',
      'image_key',
      'features',
      'in_stock',
    ];

    const setClauses = [];
    const values = [];
    let idx = 1;

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        if (key === 'features') {
          setClauses.push(`${key} = $${idx}`);
          values.push(JSON.stringify(fields[key]));
        } else {
          setClauses.push(`${key} = $${idx}`);
          values.push(fields[key]);
        }
        idx++;
      }
    }

    if (setClauses.length === 0) {
      return getProductById(id);
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE products 
       SET ${setClauses.join(', ')} 
       WHERE id = $${idx} 
       RETURNING *`,
      values
    );

    return rows[0] || null;
  } catch (err) {
    console.error('Error updating product:', err);
    throw err;
  }
};

const deleteProduct = async (id) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [id]
    );
    return rows[0] || null;
  } catch (err) {
    console.error('Error deleting product:', err);
    throw err;
  }
};

const getCategories = async () => {
  try {
    const { rows } = await pool.query(
      'SELECT DISTINCT category FROM products ORDER BY category'
    );
    return rows.map((r) => r.category);
  } catch (err) {
    console.error('Error fetching categories:', err);
    throw err;
  }
};

const getCategoryCounts = async () => {
  try {
    const { rows } = await pool.query(
      'SELECT category, COUNT(*)::int AS count FROM products GROUP BY category ORDER BY category'
    );
    return rows;
  } catch (err) {
    console.error('Error fetching category counts:', err);
    throw err;
  }
};

/* ────────────────────────────── Users ───────────────────────────────── */

const findUserByEmail = async (email) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  } catch (err) {
    console.error('Error finding user:', err);
    throw err;
  }
};

const createUser = async ({ name, email, password, role }) => {
  try {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email, password, role || 'customer']
    );
    return rows[0];
  } catch (err) {
    console.error('Error creating user:', err);
    throw err;
  }
};

module.exports = {
  getAllProducts,
  getFeaturedProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getCategoryCounts,
  findUserByEmail,
  createUser,
};