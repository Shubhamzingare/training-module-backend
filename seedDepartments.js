require('dotenv').config();
const mongoose = require('mongoose');
const Department = require('./src/models/Department');
const Admin = require('./src/models/Admin');

async function seedDepartments() {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('Connected to MongoDB');

    // Get the first admin user
    const admin = await Admin.findOne();
    if (!admin) {
      console.error('No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    const defaultDepartments = [
      { name: 'Payment', description: 'Payment Processing', createdBy: admin._id },
      { name: 'DM', description: 'Direct Marketing', createdBy: admin._id },
      { name: 'Yoga & Physio', description: 'Wellness Programs', createdBy: admin._id },
      { name: 'Calling', description: 'Call Center', createdBy: admin._id },
      { name: 'QC Team', description: 'Quality Control', createdBy: admin._id },
      { name: 'Interns', description: 'Internship Program', createdBy: admin._id },
    ];

    // Clear existing departments
    await Department.deleteMany({});
    console.log('Cleared existing departments');

    // Insert new departments
    const created = await Department.insertMany(defaultDepartments);
    console.log(`Created ${created.length} departments:`);
    created.forEach(dept => console.log(`  - ${dept.name}`));

    await mongoose.disconnect();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

seedDepartments();
