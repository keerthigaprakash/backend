/**
 * home.schema.js
 * ───────────────
 * Request‑body validation helpers for the Home / Products module.
 * Keeps validation logic separate from controllers and services.
 */

/**
 * Validate the body of a "create product" request.
 * Returns { valid, errors } where errors is an array of strings.
 */
const validateCreateProduct = (body) => {
  const errors = [];

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.push('Product name is required and must be a non‑empty string.');
  }

  if (body.price === undefined || body.price === null || isNaN(Number(body.price))) {
    errors.push('Price is required and must be a valid number.');
  } else if (Number(body.price) < 0) {
    errors.push('Price must be a positive number.');
  }

  const allowedCategories = ['cakes', 'flowers', 'gifts', 'plants'];
  if (!body.category || !allowedCategories.includes(body.category)) {
    errors.push(`Category is required and must be one of: ${allowedCategories.join(', ')}.`);
  }

  if (body.features && !Array.isArray(body.features)) {
    errors.push('Features must be an array of strings.');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validate the body of an "update product" request.
 * All fields are optional, but if provided they must pass the same rules.
 */
const validateUpdateProduct = (body) => {
  const errors = [];

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      errors.push('Product name must be a non‑empty string.');
    }
  }

  if (body.price !== undefined) {
    if (isNaN(Number(body.price))) {
      errors.push('Price must be a valid number.');
    } else if (Number(body.price) < 0) {
      errors.push('Price must be a positive number.');
    }
  }

  if (body.category !== undefined) {
    const allowedCategories = ['cakes', 'flowers', 'gifts', 'plants'];
    if (!allowedCategories.includes(body.category)) {
      errors.push(`Category must be one of: ${allowedCategories.join(', ')}.`);
    }
  }

  if (body.features !== undefined && !Array.isArray(body.features)) {
    errors.push('Features must be an array of strings.');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validate login credentials.
 */
const validateLogin = (body) => {
  const errors = [];

  if (!body.email || typeof body.email !== 'string' || body.email.trim().length === 0) {
    errors.push('Email is required.');
  } else {
    // Basic e‑mail format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      errors.push('Please provide a valid email address.');
    }
  }

  if (!body.password || typeof body.password !== 'string' || body.password.length < 1) {
    errors.push('Password is required.');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validate register body.
 */
const validateRegister = (body) => {
  const errors = [];

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.push('Name is required.');
  }

  if (!body.email || typeof body.email !== 'string') {
    errors.push('Email is required.');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      errors.push('Please provide a valid email address.');
    }
  }

  if (!body.password || typeof body.password !== 'string') {
    errors.push('Password is required.');
  } else if (body.password.length < 6) {
    errors.push('Password must be at least 6 characters.');
  }

  return { valid: errors.length === 0, errors };
};

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
  validateLogin,
  validateRegister,
};
