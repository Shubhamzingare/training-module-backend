const mongoose = require('mongoose');
const env = require('../src/config/env');
const Category = require('../src/models/Category');
const Admin = require('../src/models/Admin');

const seedCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(env.DB_URI);
    console.log('Connected to MongoDB');

    // Get first admin (or create one)
    let admin = await Admin.findOne({ role: 'super_admin' });
    if (!admin) {
      admin = await Admin.findOne();
      if (!admin) {
        console.log('No admin found. Please seed admin first.');
        process.exit(1);
      }
    }

    // New Deployment Categories (Pods)
    const newDeploymentPods = [
      {
        name: 'Growth x Techpix Demo',
        description: 'Tools + Offline Meetups',
        icon: '🤝',
        type: 'new_deployment',
        order: 1,
      },
      {
        name: 'Experience Pod',
        description: 'Member experience & journey',
        icon: '🫂',
        type: 'new_deployment',
        order: 2,
      },
      {
        name: 'Mobile Pod',
        description: 'Mobile app development',
        icon: '📱',
        type: 'new_deployment',
        order: 3,
      },
      {
        name: 'Beetu Pod',
        description: 'AI coach automated replies',
        icon: '🤖',
        type: 'new_deployment',
        order: 4,
      },
      {
        name: 'CRM Pod',
        description: 'Internal Member relationship management system',
        icon: '💬',
        type: 'new_deployment',
        order: 5,
      },
      {
        name: 'Growth Pod',
        description: 'User acquisition & retention',
        icon: '🌱',
        type: 'new_deployment',
        order: 6,
      },
      {
        name: 'Platform & Link Pod',
        description: 'Sessions links & billing',
        icon: '🔗',
        type: 'new_deployment',
        order: 7,
      },
      {
        name: 'Insights Pod',
        description: 'Business insights & reports',
        icon: '🔍',
        type: 'new_deployment',
        order: 8,
      },
      {
        name: 'Design Pod',
        description: 'UI/UX & visual design',
        icon: '🎨',
        type: 'new_deployment',
        order: 9,
      },
    ];

    // Wati Training Categories
    const watiCategories = [
      {
        name: 'CRM',
        description: 'Customer Relationship Management training',
        icon: '💬',
        type: 'wati_training',
        order: 1,
      },
      {
        name: 'Free Challenge',
        description: 'Free tier challenges and exercises',
        icon: '⚡',
        type: 'wati_training',
        order: 2,
      },
      {
        name: 'App',
        description: 'App features and functionality',
        icon: '📱',
        type: 'wati_training',
        order: 3,
      },
      {
        name: 'Other',
        description: 'Miscellaneous training content',
        icon: '📚',
        type: 'wati_training',
        order: 4,
      },
    ];

    const allCategories = [...newDeploymentPods, ...watiCategories];

    // Delete existing categories (optional - comment out to preserve)
    // await Category.deleteMany({});

    // Insert new categories
    for (const catData of allCategories) {
      const exists = await Category.findOne({ name: catData.name });
      if (!exists) {
        await Category.create({
          ...catData,
          createdBy: admin._id,
        });
        console.log(`✓ Created: ${catData.name}`);
      } else {
        console.log(`⊘ Skipped (exists): ${catData.name}`);
      }
    }

    console.log('\n✓ Categories seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

seedCategories();
