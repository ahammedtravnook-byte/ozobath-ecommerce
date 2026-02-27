// ============================================
// OZOBATH - Auth Controller (Full Implementation)
// ============================================
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const { sendResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/generateToken');

// ─── Register ────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email and password are required.');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  const user = await User.create({ name, email, phone, password, role: 'customer' });
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const options = {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
  };
  res.cookie('refreshToken', refreshToken, options);

  sendResponse(res, 201, {
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
    accessToken,
  }, 'Registration successful');
});

// ─── Login ───────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required.');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new ApiError(401, 'Invalid email or password.');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError(401, 'Invalid email or password.');

  if (!user.isActive) throw new ApiError(403, 'Account deactivated. Contact support.');

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const options = {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
  };
  res.cookie('refreshToken', refreshToken, options);

  sendResponse(res, 200, {
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, avatar: user.avatar },
    accessToken,
  }, 'Login successful');
});

// ─── Refresh Token ───────────────────────────────
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.refreshToken || req.body.refreshToken;
  if (!incomingToken) throw new ApiError(401, 'Refresh token missing.');

  const decoded = verifyRefreshToken(incomingToken);
  const user = await User.findById(decoded.id).select('+refreshToken');

  if (!user || user.refreshToken !== incomingToken) {
    throw new ApiError(401, 'Invalid refresh token.');
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const options = {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
  };
  res.cookie('refreshToken', refreshToken, options);

  sendResponse(res, 200, { accessToken }, 'Token refreshed');
});

// ─── Logout ──────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
  res.clearCookie('refreshToken');
  sendResponse(res, 200, null, 'Logged out successfully');
});

// ─── Get Profile ─────────────────────────────────
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  sendResponse(res, 200, user, 'Profile fetched');
});

// ─── Update Profile ──────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone, avatar },
    { new: true, runValidators: true }
  );
  sendResponse(res, 200, user, 'Profile updated');
});

module.exports = { register, login, refreshAccessToken, logout, getProfile, updateProfile };
