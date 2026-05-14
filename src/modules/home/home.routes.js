/**
 * home.routes.js
 * ──────────────
 * Defines all routes for the Home module and wires them to the controller.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const controller = require('./home.controller');

const uploadDir = path.join(__dirname, '../../../../uploads/');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });
const { authenticate, authorize } = require('../../shared/middleware/auth');

/* ──── Public routes ─────────────────────────────────────────────── */

// Auth
router.post('/auth/register', controller.register);
router.post('/auth/login', controller.login);

// Products (read/write)
router.get('/products', controller.getProducts);
router.post('/products', authenticate, authorize('admin'), upload.single('image'), controller.createProduct);
router.get('/featured', controller.getFeaturedProducts);
router.get('/products/:id', controller.getProductById);
router.get('/categories', controller.getCategories);
router.get('/categories/counts', controller.getCategoryCounts);

/* ──── Protected routes (require login + admin role) ─────────────── */

router.put('/products/:id', authenticate, authorize('admin'), controller.updateProduct);
router.delete('/products/:id', authenticate, authorize('admin'), controller.deleteProduct);

module.exports = router;
