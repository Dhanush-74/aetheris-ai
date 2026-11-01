const db = require('../config/db');
const User = require('../models/User');
const storeFallback = require('../utils/storeFallback');

// Get profile stats
const getProfileStats = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    let user;

    if (db.getStatus()) {
      user = await User.findById(userId).select('-password');
    } else {
      user = await storeFallback.findUserById(userId);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfileStats
};
