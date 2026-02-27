// ============================================
// OZOBATH - Authentication Middleware
// ============================================
const { verifyAccessToken } = require('../utils/generateToken');
const ApiError = require('../utils/apiError');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError(401, 'Authentication required. Please log in.');
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      throw new ApiError(401, 'User not found. Token may be invalid.');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Account has been deactivated.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new ApiError(401, 'Invalid token.'));
    } else if (error.name === 'TokenExpiredError') {
      next(new ApiError(401, 'Token expired. Please refresh.'));
    } else {
      next(error);
    }
  }
};

module.exports = auth;
