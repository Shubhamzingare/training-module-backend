/**
 * Vercel Serverless Entry Point
 * Ensures DB connection on every cold start
 */
const mongoose = require('mongoose');

// Connect to DB only if not already connected
let isConnected = false;
async function ensureDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.DB_URI, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 10000,
  });
  isConnected = true;
}

const app = require('../src/app');

module.exports = async (req, res) => {
  await ensureDB();
  return app(req, res);
};
