/**
 * Seed Training Data from Google Sheet
 * Run: node seedTrainingData.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

const BACKEND_URL = 'https://training-module-backend-n5csf4e6j-komal-4348s-projects.vercel.app';

// ── Training modules from the Google Sheet ──
const SUPPORT_TRAINING_MODULES = [
  // New Materials 2026 — CRM category
  { title: 'Habuild Intro / Members Journey / Basics of Product', contentUrl: 'https://canva.link/nw6weqcbvt5ib8c', contentType: 'canva', category: 'Wati Training' },
  { title: 'Introduction to Communication Platforms / CRM Features', contentUrl: 'https://canva.link/ee1k3qm67tx9k7u', contentType: 'canva', category: 'CRM' },
  { title: 'Paid Members App — Features & Dashboard', contentUrl: 'https://canva.link/lxb3rmlq99139ve', contentType: 'canva', category: 'Wati Training' },
  { title: 'Free Members App — Features & Dashboard', contentUrl: 'https://canva.link/d1qsb3lzfrl547r', contentType: 'canva', category: 'Wati Training' },
  { title: 'Free & Paid Member Referrals — Eligibility & Rules', contentUrl: 'https://canva.link/gwk2e7y5p48kt0a', contentType: 'canva', category: 'Wati Training' },
  { title: 'Payments — Platform, Options, Integration with CRM', contentUrl: 'https://canva.link/a9f9wb5oiuyk2m0', contentType: 'canva', category: 'Wati Training' },
  { title: 'Link Issues & Solutions — How to Handle & Escalate', contentUrl: 'https://canva.link/z97bl6m1ngc1mta', contentType: 'canva', category: 'Wati Training' },
  { title: "Remaining QR's — Common/Most Used", contentUrl: 'https://canva.link/z97bl6m1ngc1mta', contentType: 'canva', category: 'Wati Training' },
  { title: 'Internal Team Uses Forms — When/How to Use', contentUrl: 'https://canva.link/z97bl6m1ngc1mta', contentType: 'canva', category: 'Wati Training' },
  // Training feedback
  { title: 'Training Feedback Form', contentUrl: 'https://forms.gle/fRHgqFkCdLFC7wAt6', contentType: 'link', category: 'Wati Training' },
];

// ── Tests from the Google Sheet ──
const TESTS = [
  { title: 'Basics of Product Test', googleFormUrl: 'https://forms.gle/pVgaQaGwBePNnFo96' },
  { title: 'CRM Test', googleFormUrl: 'https://forms.gle/9NVYPWqoAQUf3MEG7' },
  { title: 'Free & Paid APP / Dashboard Test', googleFormUrl: 'https://forms.gle/pkjkpYFc78tWUUGY6' },
  { title: 'Test on Referral System', googleFormUrl: 'https://forms.gle/XwYoSwBWxSJLoXWL7' },
  { title: 'Payment & Related QR Test', googleFormUrl: 'https://forms.gle/AjzYzuSR13gY1A5a9' },
  { title: 'Link Issue & Related QR Test', googleFormUrl: 'https://forms.gle/Q4CUPSzAbTqQoZnq6' },
  { title: 'Remaining Common QR Test', googleFormUrl: 'https://forms.gle/PFgKtxExjSkBUskg8' },
  { title: 'Test on All Internal Team Forms', googleFormUrl: 'https://forms.gle/s1XLrt6j1qpVXGC96' },
  { title: 'English & Aptitude Test', googleFormUrl: 'https://forms.gle/tvgVeHca7a5Um5t5A' },
  { title: 'Final Training Assessment Test', googleFormUrl: 'https://forms.gle/163M3XkDohm6edGx6' },
  { title: 'OJT Evaluation Test 1', googleFormUrl: 'https://forms.gle/4VB6HwZ63p58ZAm39' },
  { title: 'OJT Evaluation Test 2', googleFormUrl: 'https://forms.gle/EYqj9ajkDL3xQP3Z7' },
  { title: 'Comms Team Test (2025)', googleFormUrl: 'https://forms.gle/x4U5mfLHV1t1zZJQA' },
  { title: 'Comms & HCF Test (March 2026)', googleFormUrl: 'https://forms.gle/eAAHxUvp8pvPfL9N6' },
  { title: 'Comms Team — English & Aptitude Test', googleFormUrl: 'https://forms.gle/HxNXcMseXJadLViN6' },
  { title: 'OJT Lead Test', googleFormUrl: 'https://forms.gle/XtHf4a87tr4Z4oE49' },
  { title: 'Retraining Test', googleFormUrl: 'https://forms.gle/4yUxFwsdaUdUJzi76' },
  { title: 'Retraining — Inputs Form', googleFormUrl: 'https://forms.gle/NZpps1iUfXZfPDnHA' },
  { title: 'Retraining Feedback Form', googleFormUrl: 'https://forms.gle/snpwTEPWYVvAhdpVA' },
];

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.DB_URI);
  console.log('Connected!\n');

  const Admin = require('./src/models/Admin');
  const Category = require('./src/models/Category');
  const Module = require('./src/models/Module');
  const Test = require('./src/models/Test');

  const admin = await Admin.findOne({ email: 'komal@habuild.in' });
  if (!admin) { console.error('Admin not found!'); process.exit(1); }

  // ── Create modules ──
  console.log('Creating training modules...');
  for (const mod of SUPPORT_TRAINING_MODULES) {
    // Find category
    const cat = await Category.findOne({ name: { $regex: new RegExp(mod.category, 'i') }, type: 'wati_training' });
    if (!cat) { console.log(`  ⚠ Category not found: ${mod.category} — skipping "${mod.title}"`); continue; }

    // Check if already exists
    const exists = await Module.findOne({ title: mod.title, categoryId: cat._id });
    if (exists) { console.log(`  ✓ Already exists: ${mod.title}`); continue; }

    await Module.create({
      title: mod.title,
      categoryId: cat._id,
      fileType: 'pdf', // placeholder, content is external
      contentUrl: mod.contentUrl,
      contentType: mod.contentType,
      fileUrl: '',
      status: 'active',
      keyPoints: [],
      faqs: [],
      createdBy: admin._id,
    });
    console.log(`  ✅ Created module: ${mod.title}`);
  }

  // ── Create tests ──
  console.log('\nCreating tests...');
  for (const t of TESTS) {
    const exists = await Test.findOne({ title: t.title });
    if (exists) { 
      // Update googleFormUrl if missing
      if (!exists.googleFormUrl) {
        await Test.updateOne({ _id: exists._id }, { googleFormUrl: t.googleFormUrl });
        console.log(`  ↑ Updated form URL: ${t.title}`);
      } else {
        console.log(`  ✓ Already exists: ${t.title}`);
      }
      continue;
    }
    await Test.create({
      title: t.title,
      googleFormUrl: t.googleFormUrl,
      totalMarks: 100,
      passingMarks: 60,
      timeLimit: 30,
      status: 'active',
      createdBy: admin._id,
    });
    console.log(`  ✅ Created test: ${t.title}`);
  }

  console.log('\nDone!');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
