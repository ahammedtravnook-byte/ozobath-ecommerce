// ============================================
// OZOBATH Shared Validators
// ============================================

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[6-9]\d{9}$/; // Indian phone numbers
const pinRegex = /^\d{6}$/; // Indian PIN codes

const isValidEmail = (email) => emailRegex.test(email);
const isValidPhone = (phone) => phoneRegex.test(phone);
const isValidPin = (pin) => pinRegex.test(pin);

const isValidPassword = (password) => {
  // Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number
  return password && password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password);
};

const sanitizeString = (str) => {
  if (!str) return '';
  return str.trim().replace(/<[^>]*>/g, '');
};

module.exports = {
  emailRegex,
  phoneRegex,
  pinRegex,
  isValidEmail,
  isValidPhone,
  isValidPin,
  isValidPassword,
  sanitizeString,
};
