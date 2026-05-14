/**
 * home.controller.js
 * ──────────────────
 * Route handlers (request → response) for the Home module.
 * Delegates business logic to home.service.js and validates input
 * with home.schema.js.
 */

const service = require('./home.service');
const schema = require('./home.schema');

/* ──────────────────────────── Products ──────────────────────────── */

/**
 * GET /api/home/products
 * Query params: ?category=cakes
 */
const getProducts = async (req, res) => {
  try {
    const { category } = req.query;
    const products = await service.getProducts(category);
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch products.',
    });
  }
};

/**
 * GET /api/home/featured
 */
const getFeaturedProducts = async (req, res) => {
  try {
    const products = await service.getFeaturedProducts();
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch featured products.',
    });
  }
};

/**
 * GET /api/home/products/:id
 */
const getProductById = async (req, res) => {
  try {
    const product = await service.getProductById(req.params.id);
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch product.',
    });
  }
};

/**
 * POST /api/home/products  (protected – admin only)
 */
const createProduct = async (req, res) => {
  try {
    if (req.file) {
      req.body.image_key = `/uploads/${req.file.filename}`;
    }

    const { valid, errors } = schema.validateCreateProduct(req.body);
    if (!valid) {
      return res.status(400).json({ success: false, errors });
    }

    const product = await service.createProduct(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create product.',
    });
  }
};

/**
 * PUT /api/home/products/:id  (protected – admin only)
 */
const updateProduct = async (req, res) => {
  try {
    const { valid, errors } = schema.validateUpdateProduct(req.body);
    if (!valid) {
      return res.status(400).json({ success: false, errors });
    }

    const product = await service.updateProduct(req.params.id, req.body);
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update product.',
    });
  }
};

/**
 * DELETE /api/home/products/:id  (protected – admin only)
 */
const deleteProduct = async (req, res) => {
  try {
    const deleted = await service.deleteProduct(req.params.id);
    res.json({ success: true, message: 'Product deleted.', data: deleted });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to delete product.',
    });
  }
};

/**
 * GET /api/home/categories
 */
const getCategories = async (req, res) => {
  try {
    const categories = await service.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch categories.',
    });
  }
};

/**
 * GET /api/home/categories/counts
 */
const getCategoryCounts = async (req, res) => {
  try {
    const counts = await service.getCategoryCounts();
    res.json({ success: true, data: counts });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch category counts.',
    });
  }
};

/* ──────────────────────────── Auth ──────────────────────────────── */

/**
 * POST /api/home/auth/register
 */
const register = async (req, res) => {
  try {
    const { valid, errors } = schema.validateRegister(req.body);
    if (!valid) {
      return res.status(400).json({ success: false, errors });
    }

    const result = await service.registerUser(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Registration failed.',
    });
  }
};

/**
 * POST /api/home/auth/login
 */
const login = async (req, res) => {
  try {
    const { valid, errors } = schema.validateLogin(req.body);
    if (!valid) {
      return res.status(400).json({ success: false, errors });
    }

    const result = await service.loginUser(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Login failed.',
    });
  }
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
  register,
  login,
};
