const mongoose = require('mongoose');
const env = require('../src/config/env');
const Admin = require('../src/models/Admin');

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(env.DB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create super admin user
    const admin = new Admin({
      name: 'Super Admin',
      email: 'admin@example.com',
      password: 'admin@123', // Change this in production!
      role: 'super_admin',
      isActive: true,
    });

    await admin.save();
    console.log('✓ Super admin created successfully');
    console.log('Email: admin@example.com');
    console.log('Password: admin@123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
