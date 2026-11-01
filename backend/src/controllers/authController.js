const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const db = require('../config/db');
const User = require('../models/User');
const storeFallback = require('../utils/storeFallback');
const logger = require('../utils/logger');

const generateToken = (id) => {
  return jwt.sign({ id }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN
  });
};

// Register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    let user;
    if (db.getStatus()) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists'
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`
      });
    } else {
      user = await storeFallback.createUser({ name, email, password });
    }

    const token = generateToken(user._id || user.id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        preferences: user.preferences
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    let user;
    if (db.getStatus()) {
      user = await User.findOne({ email: email.toLowerCase() });
    } else {
      user = await storeFallback.findUserByEmail(email);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user._id || user.id);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        preferences: user.preferences
      }
    });
  } catch (error) {
    next(error);
  }
};

// Demo/Guest Login for instant testing
const demoLogin = async (req, res, next) => {
  try {
    const demoEmail = 'guest.explorer@aetheris.ai';
    const demoPassword = 'AetherisGuest2026!';
    let user;

    if (db.getStatus()) {
      user = await User.findOne({ email: demoEmail });
      if (!user) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(demoPassword, salt);
        user = await User.create({
          name: 'Quantum Explorer',
          email: demoEmail,
          password: hashedPassword,
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AetherisGuest'
        });
      }
    } else {
      user = await storeFallback.findUserByEmail(demoEmail);
      if (!user) {
        user = await storeFallback.createUser({
          name: 'Quantum Explorer',
          email: demoEmail,
          password: demoPassword
        });
      }
    }

    const token = generateToken(user._id || user.id);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        preferences: user.preferences
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get Current User
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id || req.user.id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      preferences: req.user.preferences
    }
  });
};

// Update Preferences
const updatePreferences = async (req, res, next) => {
  try {
    const { theme, geminiModel, customInstruction } = req.body;
    const userId = req.user._id || req.user.id;

    let updatedUser;
    if (db.getStatus()) {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            'preferences.theme': theme,
            'preferences.geminiModel': geminiModel,
            'preferences.customInstruction': customInstruction
          }
        },
        { new: true }
      ).select('-password');
    } else {
      updatedUser = await storeFallback.updateUserPreferences(userId, {
        theme,
        geminiModel,
        customInstruction
      });
    }

    return res.status(200).json({
      success: true,
      preferences: updatedUser.preferences
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  demoLogin,
  getMe,
  updatePreferences
};
