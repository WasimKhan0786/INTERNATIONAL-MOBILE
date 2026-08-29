const jwt = require('jsonwebtoken');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config();

module.exports = async (req, res, next) => {
  try {
    let token = '';

    // Check for authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No login token found. Access denied.'
      });
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET || 'techzone_default_jwt_secret';
    const decoded = jwt.verify(token, jwtSecret);

    // Load admin user session
    const admin = await User.findById(decoded.id).select('-password');
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Administrator session not found.'
      });
    }

    // Bind authenticated admin object to request
    req.admin = admin;
    next();
  } catch (err) {
    console.error('JWT Auth Error:', err);
    return res.status(401).json({
      success: false,
      message: 'Token is expired or invalid. Please login again.'
    });
  }
};
