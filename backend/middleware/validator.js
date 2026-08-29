/**
 * Strict Input Schema Validation Middleware Suite
 * Validates type, length, bounds, and format against explicit schemas.
 * Rejects invalid inputs with HTTP 400 Bad Request instead of silent sanitization.
 */

// Regular Expression Format Helpers
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^\+?[0-9\s-]{10,15}$/;
const SLUG_REGEX = /^[a-z0-9-]+$/;
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const SKU_REGEX = /^[a-zA-Z0-9_-]{2,50}$/;

/**
 * Validation Error Generator Helper
 */
const sendValidationError = (res, errors) => {
  const message = Array.isArray(errors) ? errors[0] : (errors || 'Invalid input data');
  return res.status(400).json({
    success: false,
    message: `Validation Error: ${message}`,
    errors: Array.isArray(errors) ? errors : [errors]
  });
};

/**
 * Type & Format Checking Helper Utilities
 */
const isString = (val) => typeof val === 'string';
const isNumber = (val) => typeof val === 'number' && !isNaN(val);
const isNumeric = (val) => isNumber(val) || (isString(val) && val.trim() !== '' && !isNaN(Number(val)));
const isBoolean = (val) => typeof val === 'boolean' || val === 'true' || val === 'false';
const isArray = (val) => Array.isArray(val);

/**
 * --------------------------------------------------------------------------
 * 1. Authentication Login Schema Validator
 * --------------------------------------------------------------------------
 */
const validateAuthLogin = (req, res, next) => {
  const { email, password } = req.body || {};
  const errors = [];

  if (!email || !isString(email) || email.trim() === '') {
    errors.push('Email address is required.');
  } else {
    const cleanEmail = email.trim();
    if (cleanEmail.length < 5 || cleanEmail.length > 255) {
      errors.push('Email address must be between 5 and 255 characters.');
    } else if (!EMAIL_REGEX.test(cleanEmail)) {
      errors.push('Email address format is invalid.');
    }
  }

  if (!password || !isString(password)) {
    errors.push('Password is required.');
  } else if (password.length < 4 || password.length > 128) {
    errors.push('Password length must be between 4 and 128 characters.');
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};

/**
 * --------------------------------------------------------------------------
 * 2. Products Schema Validator (Create & Update)
 * --------------------------------------------------------------------------
 */
const validateProductInput = (isUpdate = false) => {
  return (req, res, next) => {
    const body = req.body || {};
    const errors = [];

    // Title / Name
    if (!isUpdate || body.name !== undefined) {
      if (!body.name || !isString(body.name) || body.name.trim() === '') {
        errors.push('Product name is required.');
      } else if (body.name.trim().length < 2 || body.name.trim().length > 200) {
        errors.push('Product name must be between 2 and 200 characters.');
      }
    }

    // Brand
    if (body.brand !== undefined && body.brand !== null && body.brand !== '') {
      if (!isString(body.brand)) {
        errors.push('Product brand must be a string.');
      } else if (body.brand.trim().length > 100) {
        errors.push('Product brand cannot exceed 100 characters.');
      }
    }

    // SKU
    if (body.sku !== undefined && body.sku !== null && body.sku !== '') {
      if (!isString(body.sku)) {
        errors.push('SKU code must be a string.');
      } else if (!SKU_REGEX.test(body.sku.trim())) {
        errors.push('SKU code must contain only letters, numbers, hyphens, and underscores (2-50 chars).');
      }
    }

    // Category Slug
    if (!isUpdate || body.categorySlug !== undefined) {
      if (!body.categorySlug || !isString(body.categorySlug) || body.categorySlug.trim() === '') {
        errors.push('Category slug is required.');
      } else if (!SLUG_REGEX.test(body.categorySlug.trim())) {
        errors.push('Category slug must contain lowercase letters, numbers, and hyphens only.');
      }
    }

    // Price
    if (!isUpdate || body.price !== undefined) {
      if (!isNumeric(body.price)) {
        errors.push('Original price is required and must be a valid number.');
      } else {
        const numPrice = Number(body.price);
        if (numPrice < 0 || numPrice > 10000000) {
          errors.push('Original price must be between ₹0 and ₹1,00,00,000.');
        }
      }
    }

    // Discount Price
    if (body.discountPrice !== undefined && body.discountPrice !== null && body.discountPrice !== '') {
      if (!isNumeric(body.discountPrice)) {
        errors.push('Discount price must be a valid number.');
      } else {
        const numDiscount = Number(body.discountPrice);
        if (numDiscount < 0 || numDiscount > 10000000) {
          errors.push('Discount price must be between ₹0 and ₹1,00,00,000.');
        }
        if (body.price && isNumeric(body.price) && numDiscount > Number(body.price)) {
          errors.push('Discount price cannot be greater than the original price.');
        }
      }
    }

    // Price Per Piece
    if (body.pricePerPiece !== undefined && body.pricePerPiece !== null && body.pricePerPiece !== '') {
      if (!isNumeric(body.pricePerPiece)) {
        errors.push('Price per piece must be a valid number.');
      } else if (Number(body.pricePerPiece) < 0 || Number(body.pricePerPiece) > 1000000) {
        errors.push('Price per piece must be between ₹0 and ₹10,00,000.');
      }
    }

    // Stock Quantity
    if (!isUpdate || body.stock !== undefined) {
      if (!isNumeric(body.stock)) {
        errors.push('Stock quantity must be a valid integer number.');
      } else {
        const numStock = Number(body.stock);
        if (!Number.isInteger(numStock) || numStock < 0 || numStock > 1000000) {
          errors.push('Stock quantity must be a non-negative integer (0 - 1,000,000).');
        }
      }
    }

    // Description
    if (body.description !== undefined && body.description !== null) {
      if (!isString(body.description)) {
        errors.push('Product description must be a string text.');
      } else if (body.description.length > 5000) {
        errors.push('Product description cannot exceed 5000 characters.');
      }
    }

    // Rating
    if (body.rating !== undefined && body.rating !== null && body.rating !== '') {
      if (!isNumeric(body.rating)) {
        errors.push('Rating must be a valid number.');
      } else {
        const numRating = Number(body.rating);
        if (numRating < 1.0 || numRating > 5.0) {
          errors.push('Rating must be between 1.0 and 5.0.');
        }
      }
    }

    // Status
    if (body.status !== undefined && body.status !== null) {
      if (!['active', 'inactive'].includes(String(body.status).toLowerCase())) {
        errors.push('Status must be either "active" or "inactive".');
      }
    }

    // Flags
    if (body.bestseller !== undefined && !isBoolean(body.bestseller)) {
      errors.push('Bestseller flag must be boolean (true/false).');
    }
    if (body.featured !== undefined && !isBoolean(body.featured)) {
      errors.push('Featured flag must be boolean (true/false).');
    }
    if (body.newArrival !== undefined && !isBoolean(body.newArrival)) {
      errors.push('NewArrival flag must be boolean (true/false).');
    }

    if (errors.length > 0) {
      return sendValidationError(res, errors);
    }

    next();
  };
};

/**
 * --------------------------------------------------------------------------
 * 3. Bulk Products Upload Schema Validator
 * --------------------------------------------------------------------------
 */
const validateBulkProductInput = (req, res, next) => {
  const { products } = req.body || {};
  if (!products || !isArray(products) || products.length === 0) {
    return sendValidationError(res, 'Bulk upload requires a non-empty array of products.');
  }
  if (products.length > 500) {
    return sendValidationError(res, 'Bulk upload limit exceeded. Maximum 500 products per upload batch.');
  }
  next();
};

/**
 * --------------------------------------------------------------------------
 * 4. Categories Schema Validator (Create & Update)
 * --------------------------------------------------------------------------
 */
const validateCategoryInput = (isUpdate = false) => {
  return (req, res, next) => {
    const body = req.body || {};
    const errors = [];

    if (!isUpdate || body.name !== undefined) {
      if (!body.name || !isString(body.name) || body.name.trim() === '') {
        errors.push('Category name is required.');
      } else if (body.name.trim().length < 2 || body.name.trim().length > 100) {
        errors.push('Category name must be between 2 and 100 characters.');
      }
    }

    if (body.slug !== undefined && body.slug !== null && body.slug !== '') {
      if (!isString(body.slug) || !SLUG_REGEX.test(body.slug.trim())) {
        errors.push('Category slug must contain lowercase letters, numbers, and hyphens only.');
      }
    }

    if (body.description !== undefined && body.description !== null) {
      if (!isString(body.description)) {
        errors.push('Category description must be a string text.');
      } else if (body.description.length > 1000) {
        errors.push('Category description cannot exceed 1000 characters.');
      }
    }

    if (body.order !== undefined && body.order !== null && body.order !== '') {
      if (!isNumeric(body.order)) {
        errors.push('Display order must be a number.');
      } else if (Number(body.order) < 0 || Number(body.order) > 10000) {
        errors.push('Display order must be between 0 and 10000.');
      }
    }

    if (body.status !== undefined && body.status !== null) {
      if (!['active', 'inactive'].includes(String(body.status).toLowerCase())) {
        errors.push('Status must be either "active" or "inactive".');
      }
    }

    if (errors.length > 0) {
      return sendValidationError(res, errors);
    }

    next();
  };
};

/**
 * --------------------------------------------------------------------------
 * 5. Orders Checkout Submission Schema Validator
 * --------------------------------------------------------------------------
 */
const validateOrderInput = (req, res, next) => {
  const body = req.body || {};
  const errors = [];

  // Customer Name
  const custName = body.customerName || body.name;
  if (!custName || !isString(custName) || custName.trim() === '') {
    errors.push('Customer name is required.');
  } else if (custName.trim().length < 2 || custName.trim().length > 100) {
    errors.push('Customer name must be between 2 and 100 characters.');
  }

  // Shop Name (Optional)
  if (body.shopName !== undefined && body.shopName !== null && body.shopName !== '') {
    if (!isString(body.shopName) || body.shopName.trim().length > 150) {
      errors.push('Shop name cannot exceed 150 characters.');
    }
  }

  // Mobile
  const mobile = body.mobile || body.phone;
  if (!mobile || !isString(mobile) || mobile.trim() === '') {
    errors.push('Mobile contact number is required.');
  } else if (!PHONE_REGEX.test(mobile.trim())) {
    errors.push('Mobile contact number format is invalid (10-15 digits).');
  }

  // Email (Optional)
  if (body.email !== undefined && body.email !== null && body.email !== '') {
    if (!isString(body.email) || !EMAIL_REGEX.test(body.email.trim())) {
      errors.push('Customer email format is invalid.');
    }
  }

  // Address
  if (!body.address || !isString(body.address) || body.address.trim() === '') {
    errors.push('Delivery address is required.');
  } else if (body.address.trim().length < 5 || body.address.trim().length > 500) {
    errors.push('Delivery address must be between 5 and 500 characters.');
  }

  // Products Array
  if (!body.products || !isArray(body.products) || body.products.length === 0) {
    errors.push('Order must contain at least one product item.');
  } else {
    body.products.forEach((item, index) => {
      if (!item || typeof item !== 'object') {
        errors.push(`Item at index ${index} is invalid.`);
      } else {
        if (!item.name || !isString(item.name)) {
          errors.push(`Item at index ${index} missing product name.`);
        }
        if (!isNumeric(item.price) || Number(item.price) < 0) {
          errors.push(`Item "${item.name || index}" has invalid price.`);
        }
        if (!isNumeric(item.quantity) || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1) {
          errors.push(`Item "${item.name || index}" must have a quantity of at least 1.`);
        }
      }
    });
  }

  // Order Notes (Optional)
  if (body.orderNotes !== undefined && body.orderNotes !== null) {
    if (!isString(body.orderNotes) || body.orderNotes.length > 1000) {
      errors.push('Order notes cannot exceed 1000 characters.');
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};

/**
 * --------------------------------------------------------------------------
 * 6. Order Status Update Schema Validator
 * --------------------------------------------------------------------------
 */
const validateOrderStatusInput = (req, res, next) => {
  const { status } = req.body || {};
  const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  
  if (!status || !isString(status) || !validStatuses.includes(status.trim())) {
    return sendValidationError(res, `Order status must be one of: ${validStatuses.join(', ')}.`);
  }

  next();
};

/**
 * --------------------------------------------------------------------------
 * 7. Banners Schema Validator (Create & Update)
 * --------------------------------------------------------------------------
 */
const validateBannerInput = (isUpdate = false) => {
  return (req, res, next) => {
    const body = req.body || {};
    const errors = [];

    if (!isUpdate || body.title !== undefined) {
      if (!body.title || !isString(body.title) || body.title.trim() === '') {
        errors.push('Banner title is required.');
      } else if (body.title.trim().length < 2 || body.title.trim().length > 150) {
        errors.push('Banner title must be between 2 and 150 characters.');
      }
    }

    if (body.subtitle !== undefined && body.subtitle !== null) {
      if (!isString(body.subtitle) || body.subtitle.length > 250) {
        errors.push('Banner subtitle cannot exceed 250 characters.');
      }
    }

    if (body.buttonText !== undefined && body.buttonText !== null) {
      if (!isString(body.buttonText) || body.buttonText.length > 50) {
        errors.push('Button text cannot exceed 50 characters.');
      }
    }

    if (body.order !== undefined && body.order !== null && body.order !== '') {
      if (!isNumeric(body.order) || Number(body.order) < 0 || Number(body.order) > 1000) {
        errors.push('Display order must be an integer between 0 and 1000.');
      }
    }

    if (body.status !== undefined && body.status !== null) {
      if (!['active', 'inactive'].includes(String(body.status).toLowerCase())) {
        errors.push('Status must be either "active" or "inactive".');
      }
    }

    if (errors.length > 0) {
      return sendValidationError(res, errors);
    }

    next();
  };
};

/**
 * --------------------------------------------------------------------------
 * 8. Settings Schema Validator
 * --------------------------------------------------------------------------
 */
const validateSettingsInput = (req, res, next) => {
  const body = req.body || {};
  const errors = [];

  if (!body.shopName || !isString(body.shopName) || body.shopName.trim() === '') {
    errors.push('Shop name is required.');
  } else if (body.shopName.trim().length < 2 || body.shopName.trim().length > 150) {
    errors.push('Shop name must be between 2 and 150 characters.');
  }

  if (body.phone && (!isString(body.phone) || body.phone.trim().length < 5)) {
    errors.push('Support phone number is invalid.');
  }

  if (body.email && (!isString(body.email) || !EMAIL_REGEX.test(body.email.trim()))) {
    errors.push('Settings support email format is invalid.');
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};

/**
 * --------------------------------------------------------------------------
 * 9. Customer Reviews Schema Validator
 * --------------------------------------------------------------------------
 */
const validateReviewInput = (req, res, next) => {
  const body = req.body || {};
  const errors = [];

  const name = body.customerName || body.name;
  if (!name || !isString(name) || name.trim() === '') {
    errors.push('Customer name is required.');
  } else if (name.trim().length < 2 || name.trim().length > 100) {
    errors.push('Customer name must be between 2 and 100 characters.');
  }

  if (!body.rating || !isNumeric(body.rating)) {
    errors.push('Rating is required.');
  } else {
    const numRating = Number(body.rating);
    if (numRating < 1 || numRating > 5) {
      errors.push('Rating must be an integer or decimal between 1 and 5.');
    }
  }

  if (!body.comment || !isString(body.comment) || body.comment.trim() === '') {
    errors.push('Review comment is required.');
  } else if (body.comment.trim().length < 5 || body.comment.trim().length > 1000) {
    errors.push('Review comment must be between 5 and 1000 characters.');
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};

/**
 * --------------------------------------------------------------------------
 * 10. Route Param ID Schema Validator
 * --------------------------------------------------------------------------
 */
const validateParamId = (req, res, next) => {
  const { id } = req.params || {};
  if (id && isString(id) && id.trim() !== '') {
    const cleanId = id.trim();
    if (cleanId.length === 24 && !OBJECT_ID_REGEX.test(cleanId)) {
      return sendValidationError(res, 'Route ID parameter has invalid 24-character ObjectId format.');
    }
    if (!/^[a-zA-Z0-9_-]{2,64}$/.test(cleanId)) {
      return sendValidationError(res, 'Route ID parameter format is invalid.');
    }
  }
  next();
};


module.exports = {
  validateAuthLogin,
  validateProductInput,
  validateBulkProductInput,
  validateCategoryInput,
  validateOrderInput,
  validateOrderStatusInput,
  validateBannerInput,
  validateSettingsInput,
  validateReviewInput,
  validateParamId
};
