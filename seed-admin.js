const mongoose = require('mongoose');
const path = require('path');

// Import config
const env = require('./src/config/env');

// Connect to MongoDB
mongoose.connect(env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ Connected to MongoDB');

  // Import Admin model
  const Admin = require('./src/models/Admin');

  try {
    // Check if admin already exists
    const existing = await Admin.findOne({ email: 'admin@test.com' });
    if (existing) {
      console.log('✅ Admin already exists');
      process.exit(0);
    }

    // Create new admin
    const admin = new Admin({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      isActive: true,
    });

    await admin.save();
    console.log('✅ Admin created:', admin.email);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})
.catch((error) => {
  console.error('❌ MongoDB connection failed:', error.message);
  process.exit(1);
});
