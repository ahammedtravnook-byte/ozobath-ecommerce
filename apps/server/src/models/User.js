// ============================================
// OZOBATH - User Model
// ============================================
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' },
  fullName: String,
  phone: String,
  line1: { type: String, required: true },
  line2: String,
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  role: {
    type: String,
    enum: ['customer', 'admin', 'superadmin'],
    default: 'customer',
  },
  avatar: {
    url: String,
    publicId: String,
  },
  addresses: [addressSchema],
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  refreshToken: { type: String, select: false },
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.refreshToken;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  return user;
};

module.exports = mongoose.model('User', userSchema);
