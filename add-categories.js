const mongoose = require('mongoose');
const Category = require('./src/models/Category');
const Admin = require('./src/models/Admin');

const DB_URI = 'mongodb+srv://komal_habuild:0000@cluster0.wwddljy.mongodb.net/training-module?appName=Cluster0';

const categories = [
  { name: 'Growth x Techpix Demo', type: 'new_deployment', icon: '🚀' },
  { name: 'Tools', type: 'new_deployment', icon: '🔧' },
  { name: 'Offline Meetups', type: 'new_deployment', icon: '👥' },
  { name: 'Experience Pod', type: 'new_deployment', icon: '💡' },
  { name: 'Mobile Pod', type: 'new_deployment', icon: '📱' },
  { name: 'Beetu Pod', type: 'new_deployment', icon: '🎯' },
  { name: 'CRM Pod', type: 'new_deployment', icon: '📊' },
  { name: 'Growth Pod', type: 'new_deployment', icon: '📈' },
  { name: 'Platform & Link Pod', type: 'new_deployment', icon: '🔗' },
  { name: 'Insights Pod', type: 'new_deployment', icon: '🔍' },
  { name: 'Design Pod', type: 'new_deployment', icon: '🎨' }
];

async function addCategories() {
  try {
    await mongoose.connect(DB_URI);
    console.log('Connected to MongoDB\n');
    
    // Find an admin user to use as createdBy
    let admin = await Admin.findOne();
    if (!admin) {
      console.log('No admin found, creating default admin...');
      // If no admin exists, we can't create categories
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
    
    console.log('\n✅ All categories processed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addCategories();
