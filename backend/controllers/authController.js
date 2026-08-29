const User = require('../models/User');
const Settings = require('../models/Settings');
const jwt = require('jsonwebtoken');
const { recordAuthSuccess, recordAuthFailure } = require('../middleware/rateLimiter');

const signToken = (id) => {
  const jwtSecret = process.env.JWT_SECRET || 'techzone_default_jwt_secret';
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: '7d'
  });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email and password'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find admin user by email
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      recordAuthFailure(req);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify Password safely
    let isMatch = false;
    try {
      isMatch = await user.comparePassword(password);
    } catch (bcryptErr) {
      console.error('Password comparison failed for user:', cleanEmail, bcryptErr);
      recordAuthFailure(req);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!isMatch) {
      recordAuthFailure(req);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Reset rate limiter backoff on success
    recordAuthSuccess(req);

    // Generate JWT Token
    const token = signToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      admin: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('[AUTH CONTROLLER ERROR]', err.stack || err);
    return res.status(500).json({
      success: false,
      message: 'An unexpected server error occurred during login. Please try again.'
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    // req.admin is bound by the auth middleware
    return res.status(200).json({
      success: true,
      admin: req.admin
    });
  } catch (err) {
    console.error('Get profile session error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error loading profile session'
    });
  }
};

exports.logout = async (req, res) => {
  // Stateless JWT: logout is completed by clearing client storage, return success
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

