// ============================================
// OZOBATH - Super Admin Seeder
// ============================================
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const env = require('../config/env');

const seedSuperAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({ role: 'superadmin' });

    if (existingAdmin) {
      console.log('✅ Super Admin already exists:', existingAdmin.email);
      process.exit(0);
    }

    const superAdmin = await User.create({
      name: env.SUPER_ADMIN_NAME || 'OZOBATH Admin',
      email: env.SUPER_ADMIN_EMAIL || 'ozobath@gmail.com',
      phone: env.SUPER_ADMIN_PHONE || '7899202927',
      password: env.SUPER_ADMIN_PASSWORD || 'OzoBath@2024',
      role: 'superadmin',
      isActive: true,
      emailVerified: true,
    });

    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║      🔐 SUPER ADMIN CREATED                 ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  Name  : ${superAdmin.name.padEnd(34)}║`);
    console.log(`║  Email : ${superAdmin.email.padEnd(34)}║`);
    console.log(`║  Role  : ${superAdmin.role.padEnd(34)}║`);
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seedSuperAdmin();
