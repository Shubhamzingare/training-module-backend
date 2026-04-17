const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Training Module API is running' });
});

// Sample API endpoint
app.get('/api/modules', (req, res) => {
  res.json({
    modules: [
      { id: 1, title: 'Module 1', description: 'Introduction' },
      { id: 2, title: 'Module 2', description: 'Advanced Topics' }
    ]
  });
});

// Get single module
app.get('/api/modules/:id', (req, res) => {
  res.json({
    id: req.params.id,
    title: `Module ${req.params.id}`,
    content: 'Module content goes here'
  });
});

// Test POST endpoint
app.post('/api/test', (req, res) => {
  res.json({ message: 'Test successful', data: req.body });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Training Module API running on port ${PORT}`);
});
