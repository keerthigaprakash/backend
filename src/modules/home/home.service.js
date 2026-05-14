/**
 * home.service.js
 * ───────────────
 * Business‑logic layer for the Home module.
 * Sits between the controller (HTTP) and the model (database).
 */

const bcrypt = require('bcryptjs');
const model = require('./home.model');
const { generateToken } = require('../../shared/middleware/auth');

/* ──────────────────────────── Products ──────────────────────────── */

const getProducts = async (category) => {
  return model.getAllProducts(category);
};

const getFeaturedProducts = async () => {
  return model.getFeaturedProducts();
};

const getProductById = async (id) => {
  const product = await model.getProductById(id);
  if (!product) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }
  return product;
};

const createProduct = async (data) => {
  return model.createProduct(data);
};

const updateProduct = async (id, data) => {
  const existing = await model.getProductById(id);
  if (!existing) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }
  return model.updateProduct(id, data);
};

const deleteProduct = async (id) => {
  const deleted = await model.deleteProduct(id);
  if (!deleted) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }
  return deleted;
};

const getCategories = async () => {
  return model.getCategories();
};

const getCategoryCounts = async () => {
  return model.getCategoryCounts();
};

/* ──────────────────────────── Auth ────────────────────────────────
 */

const registerUser = async ({ name, email, password }) => {
  // Check if user already exists
  const existing = await model.findUserByEmail(email);
  if (existing) {
    const error = new Error('A user with this email already exists.');
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await model.createUser({
    name,
    email,
    password: hashedPassword,
    role: 'customer',
  });

  const token = generateToken(user);
  return { user, token };
};

const loginUser = async ({ email, password }) => {
  const user = await model.findUserByEmail(email);
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Strip password from response
  const { password: _, ...safeUser } = user;
  const token = generateToken(safeUser);
  return { user: safeUser, token };
};

module.exports = {
  getProducts,
  getFeaturedProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getCategoryCounts,
  registerUser,
  loginUser,
};
