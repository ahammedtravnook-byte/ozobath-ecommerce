// Minimal env bootstrap so config/env.js passes its fail-fast validation
// without a real .env. Required before any module that reaches config/env.
// Values are non-secret placeholders and are never used to reach a network.
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/ozobath-test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-not-a-real-secret-000000';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-not-a-real-secret-11111';
process.env.CLOUDINARY_CLOUD_NAME = 'test';
process.env.CLOUDINARY_API_KEY = 'test';
process.env.CLOUDINARY_API_SECRET = 'test';
process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
process.env.RAZORPAY_KEY_SECRET = 'test';

// Pin the limit so tests assert against a known ceiling regardless of
// whatever a developer has in their own .env.
process.env.MAX_ORDER_QUANTITY = '50';
