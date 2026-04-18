const mongoose = require('mongoose');
const Category = require('./src/models/Category');
const Admin = require('./src/models/Admin');

const DB_URI = 'mongodb+srv://komal_habuild:0000@cluster0.wwddljy.mongodb.net/training-module?appName=Cluster0';

const categories = [
  { name: 'Wati', type: 'wati_training', icon: '💬' },
  { name: 'CRM', type: 'wati_training', icon: '📊' },
  { name: 'Dashboard', type: 'wati_training', icon: '📈' },
  { name: 'Free challenge', type: 'wati_training', icon: '🎯' },
  { name: 'Mobile App', type: 'wati_training', icon: '📱' },
  { name: 'Community Events', type: 'wati_training', icon: '👥' }
];

async function addCategories() {
  try {
    await mongoose.connect(DB_URI);
    console.log('Connected to MongoDB\n');
    
    // Find an admin user to use as createdBy
    let admin = await Admin.findOne();
    if (!admin) {
      throw new Error('No admin user found in database');
    }
    
    console.log(`Using admin: ${admin.email}\n`);
    
    for (const cat of categories) {
      const exists = await Category.findOne({ name: cat.name });
      if (!exists) {
        await Category.create({ ...cat, createdBy: admin._id });
        console.log(`✓ Added: ${cat.name}`);
      } else {
        console.log(`→ Already exists: ${cat.name}`);
      }
    }
    
    console.log('\n✅ All Support Training categories processed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addCategories();
