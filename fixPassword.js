const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const env = require('./src/config/env');

const fixPassword = async () => {
  try {
    await mongoose.connect(env.DB_URI);
    console.log('✓ Connected to MongoDB');

    const db = mongoose.connection.db;
    const adminsCollection = db.collection('admins');

    // Hash the password once
    const hashedPassword = await bcryptjs.hash('0000', 10);

    // Update the admin record directly
    const result = await adminsCollection.updateOne(
      { email: 'komal@habuild.in' },
      { $set: { password: hashedPassword } }
    );

    if (result.modifiedCount > 0) {
      console.log('✓ Admin password fixed successfully');
    } else {
      console.log('⚠ Admin not found or no changes made');
    }

    console.log('\n📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    komal@habuild.in');
    console.log('Password: 0000');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixPassword();
