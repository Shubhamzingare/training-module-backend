const express = require('express');
const cors = require('cors');
const path = require('path');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

const app = express();

// Middleware
app.use(requestLogger);
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow all origins in development, or check whitelist in production
    const allowed = [
      env.CORS_ORIGIN,
      'http://localhost:3000',
      'http://localhost:3001',
    ].filter(Boolean);
    if (env.NODE_ENV !== 'production' || allowed.includes(origin)) {
      return callback(null, true);
    }
    // In production, allow any Vercel/Render/Netlify domain
    if (origin.includes('.vercel.app') || origin.includes('.render.com') || origin.includes('.netlify.app')) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all for now during testing
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Training & Assessment Dashboard API is running',
    timestamp: new Date().toISOString(),
  });
});

// Routes - Admin
const adminAuthRoutes = require('./routes/admin/auth');
const adminCrudRoutes = require('./routes/admin/crudRoutes');

app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', adminCrudRoutes);

// Routes - Public
const publicRoutes = require('./routes/public');
app.use('/api/public', publicRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      statusCode: 404,
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
