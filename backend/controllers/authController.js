const User = require('../models/User');
const Settings = require('../models/Settings');
const jwt = require('jsonwebtoken');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'techzone_secret_key_2026', {
    expiresIn: '7d'
  });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find admin by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.'
      });
    }

    // Verify Password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password incorrect.'
      });
    }

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
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication login'
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
    console.error(err);
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
