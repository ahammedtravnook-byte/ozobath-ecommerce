// ============================================
// OZOBATH - Auth Controller (Full Implementation)
// ============================================
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const { sendResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const crypto = require('crypto');
const env = require('../config/env');
const { cleanText, isSafeUrl } = require('../utils/sanitize');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/generateToken');

// ─── Refresh token storage ───────────────────────
// The token was stored in plain text and compared with `!==`, so a database
// read (backup leak, injection, insider) yielded directly usable tokens.
// Store a hash, exactly as we do for passwords.
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Cookie options in one place.
//
// This deployment serves the API and the SPAs from different hostnames
// (api.ozobath.com vs admin.ozobath.com / www.ozobath.com). Different
// subdomains are CROSS-SITE for cookie purposes, so the refresh cookie needs
// `sameSite: 'none'` — and browsers only accept that together with `secure`,
// which in turn requires HTTPS.
//
// Driven by COOKIE_CROSS_SITE rather than NODE_ENV: tying it to NODE_ENV
// meant a single wrong env value silently downgraded the cookie to `lax`,
// which a cross-site XHR does not send — logins would appear to succeed and
// then every refresh would fail with no obvious cause.
const refreshCookieOptions = () => {
  if (env.COOKIE_CROSS_SITE) {
    return {
      httpOnly: true,
      secure: true,          // mandatory companion to sameSite:'none'
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
      ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
    };
  }

  // Same-origin (or plain-HTTP local dev): `lax` is the safer default and
  // gives CSRF protection for free.
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
};

// ─── Login throttle ──────────────────────────────
// IP rate limiting does not stop a distributed attempt against one account.
// After MAX_ATTEMPTS consecutive failures the account is locked for a window,
// which turns an online guessing attack into an impractical one.
const MAX_LOGIN_ATTEMPTS = 8;
const LOCK_MINUTES = 15;

const registerFailedLogin = async (user) => {
  const attempts = (user.failedLoginAttempts || 0) + 1;
  const update = { failedLoginAttempts: attempts };
  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    update.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
    update.failedLoginAttempts = 0;
  }
  await User.findByIdAndUpdate(user._id, update);
};

// Issue a token pair and persist the hashed refresh token.
const issueTokens = async (user) => {
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

// ─── Register ────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string') {
    throw new ApiError(400, 'Name, email and password must be strings.');
  }
  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email and password are required.');
  }
  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters.');
  }

  const normalisedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalisedEmail });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  // `role` is deliberately hardcoded, not taken from the body.
  const user = await User.create({
    name: cleanText(name, 120),
    email: normalisedEmail,
    phone: cleanText(phone, 30),
    password,
    role: 'customer',
  });
  const { accessToken, refreshToken } = await issueTokens(user);

  // Fire welcome notification (non-blocking)
  const { createNotification } = require('./notification.controller');
  createNotification(user._id, 'welcome', 'Welcome to OZOBATH!', `Hi ${user.name}! Welcome to OZOBATH. Use code FIRST10 for 10% off your first order!`, {}).catch(() => {});

  res.cookie('refreshToken', refreshToken, refreshCookieOptions());

  sendResponse(res, 201, {
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
    accessToken,
  }, 'Registration successful');
});

// ─── Login ───────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Coerce to string. Without this, `{"email":{"$regex":"^admin"}}` reached
  // the selector as an operator object, giving a match/no-match oracle for
  // enumerating accounts. (The global sanitizer strips these too; this is
  // the second layer.)
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new ApiError(400, 'Email and password must be strings.');
  }
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required.');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() })
    .select('+password +failedLoginAttempts +lockedUntil');
  if (!user) throw new ApiError(401, 'Invalid email or password.');

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutes = Math.ceil((user.lockedUntil - Date.now()) / 60000);
    throw new ApiError(429, `Account temporarily locked. Try again in ${minutes} minute(s).`);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await registerFailedLogin(user);
    throw new ApiError(401, 'Invalid email or password.');
  }

  if (!user.isActive) throw new ApiError(403, 'Account deactivated. Contact support.');

  // Successful login clears the throttle.
  if (user.failedLoginAttempts || user.lockedUntil) {
    await User.findByIdAndUpdate(user._id, { $set: { failedLoginAttempts: 0 }, $unset: { lockedUntil: 1 } });
  }

  const { accessToken, refreshToken } = await issueTokens(user);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions());

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
  if (!user) throw new ApiError(401, 'Invalid refresh token.');

  const presented = hashToken(incomingToken);
  const stored = user.refreshToken;

  // Constant-time comparison over equal-length hex digests.
  const matches =
    typeof stored === 'string' &&
    stored.length === presented.length &&
    crypto.timingSafeEqual(Buffer.from(stored, 'utf8'), Buffer.from(presented, 'utf8'));

  if (!matches) {
    // The signature verified, so this token was issued by us — but it is not
    // the current one. Either it was already rotated away (a stolen copy
    // being replayed) or the account has a second session we do not track.
    // Either way, revoke: a legitimate user re-authenticates, an attacker
    // loses the token they stole.
    await User.findByIdAndUpdate(user._id, { $unset: { refreshToken: 1 } });
    console.warn(`[auth] Refresh token reuse detected for user ${user._id} from ip ${req.ip}; session revoked.`);
    res.clearCookie('refreshToken', refreshCookieOptions());
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  if (!user.isActive) throw new ApiError(403, 'Account deactivated. Contact support.');

  const { accessToken, refreshToken } = await issueTokens(user);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions());

  sendResponse(res, 200, { accessToken }, 'Token refreshed');
});

// ─── Logout ──────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
  // clearCookie must match the attributes the cookie was set with, or the
  // browser keeps it.
  res.clearCookie('refreshToken', refreshCookieOptions());
  sendResponse(res, 200, null, 'Logged out successfully');
});

// ─── Get Profile ─────────────────────────────────
const getProfile = asyncHandler(async (req, res) => {
  // Explicit projection. `addresses` is retained deliberately — the checkout
  // flow reads them from here — but the internal fields (isActive,
  // emailVerified, createdBy, timestamps, __v) are no longer disclosed.
  //
  // NOTE: addresses remain the largest PII in this response. Moving them to
  // a dedicated endpoint is tracked as remaining work; it needs a client
  // change to avoid breaking checkout autofill.
  const user = await User.findById(req.user._id)
    .select('_id name email phone avatar role addresses')
    .lean();
  if (!user) throw new ApiError(404, 'User not found.');
  sendResponse(res, 200, user, 'Profile fetched');
});

// ─── Update Profile ──────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar } = req.body;

  // Only set what was actually supplied — passing undefined for an omitted
  // field wrote null over the stored value.
  const updates = {};
  if (name !== undefined) updates.name = cleanText(name, 120);
  if (phone !== undefined) updates.phone = cleanText(phone, 30);
  if (avatar !== undefined && avatar && typeof avatar === 'object') {
    updates.avatar = {
      url: isSafeUrl(avatar.url) ? avatar.url : undefined,
      publicId: typeof avatar.publicId === 'string' ? avatar.publicId : undefined,
    };
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  ).select('_id name email phone avatar role addresses').lean();

  sendResponse(res, 200, user, 'Profile updated');
});

// ─── Login or Register (Simplified Gmail-Only) ──
const loginOrRegister = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new ApiError(400, 'Email and password must be strings.');
  }
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required.');
  }

  let user = await User.findOne({ email: email.toLowerCase().trim() })
    .select('+password +failedLoginAttempts +lockedUntil');
  let message = 'Login successful';

  if (user) {
    // Existing user — login
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutes = Math.ceil((user.lockedUntil - Date.now()) / 60000);
      throw new ApiError(429, `Account temporarily locked. Try again in ${minutes} minute(s).`);
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await registerFailedLogin(user);
      throw new ApiError(401, 'Invalid email or password.');
    }
    if (!user.isActive) throw new ApiError(403, 'Account deactivated. Contact support.');
    if (user.failedLoginAttempts || user.lockedUntil) {
      await User.findByIdAndUpdate(user._id, { $set: { failedLoginAttempts: 0 }, $unset: { lockedUntil: 1 } });
    }
  } else {
    // New user — auto-register (derive name from email)
    if (password.length < 8) throw new ApiError(400, 'Password must be at least 8 characters.');
    const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    user = await User.create({ name, email, password, role: 'customer' });
    message = 'Account created successfully';
  }

  const { accessToken, refreshToken } = await issueTokens(user);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions());

  sendResponse(res, 200, {
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, avatar: user.avatar },
    accessToken,
  }, message);
});

// ─── Add Address ─────────────────────────────────
// Allowlist so a client cannot set `_id` (which would let one address
// overwrite another by id collision) or inject unknown fields.
const ADDRESS_FIELDS = ['label', 'fullName', 'phone', 'line1', 'line2', 'city', 'state', 'pincode'];

const pickAddress = (body) => {
  const out = {};
  for (const key of ADDRESS_FIELDS) {
    if (body[key] !== undefined) out[key] = cleanText(body[key], 200);
  }
  if (body.isDefault !== undefined) out.isDefault = Boolean(body.isDefault);
  return out;
};

const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = pickAddress(req.body);

  if (!address.line1 || !address.city || !address.state || !address.pincode) {
    throw new ApiError(400, 'line1, city, state and pincode are required.');
  }

  // Cap how many addresses one account can store — this is an unbounded,
  // authenticated write into a document that /auth/me returns in full.
  if (user.addresses.length >= 20) {
    throw new ApiError(400, 'Address limit reached (20). Delete an address before adding another.');
  }

  if (address.isDefault) {
    user.addresses.forEach(a => a.isDefault = false);
  }
  user.addresses.push(address);
  await user.save();
  sendResponse(res, 201, user.addresses, 'Address added');
});

// ─── Update Address ──────────────────────────────
const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw new ApiError(404, 'Address not found');
  const updates = pickAddress(req.body);
  if (updates.isDefault) user.addresses.forEach(a => a.isDefault = false);
  // Allowlisted assign — `Object.assign(address, req.body)` accepted `_id`.
  Object.assign(address, updates);
  await user.save();
  sendResponse(res, 200, user.addresses, 'Address updated');
});

// ─── Delete Address ──────────────────────────────
const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.addressId);
  await user.save();
  sendResponse(res, 200, user.addresses, 'Address deleted');
});

module.exports = {
  register, login, loginOrRegister, refreshAccessToken, logout,
  getProfile, updateProfile, addAddress, updateAddress, deleteAddress,
};

