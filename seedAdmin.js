const mongoose = require('mongoose');
const env = require('./src/config/env');
const Admin = require('./src/models/Admin');

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(env.DB_URI);
    console.log('✓ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'komal@habuild.in' });

    if (existingAdmin) {
      console.log('Admin user already exists. Updating password...');
      existingAdmin.password = '000000'; // Minimum 6 characters
      await existingAdmin.save();
      console.log('✓ Admin password updated');
    } else {
      // Create new admin
      const newAdmin = new Admin({
        name: 'Komal',
        email: 'komal@habuild.in',
        password: '000000', // Minimum 6 characters
        role: 'super_admin',
        isActive: true,
      });

      await newAdmin.save();
      console.log('✓ Admin user created successfully');
    }

    console.log('\n📋 Admin Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    komal@habuild.in');
    console.log('Password: 000000');
    console.log('Role:     super_admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedAdmin();
