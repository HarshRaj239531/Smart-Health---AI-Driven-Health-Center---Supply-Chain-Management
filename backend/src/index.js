const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.route');
const inventoryRoutes = require('./routes/inventory.route');
const analyticsRoutes = require('./routes/analytics.route');
const attendanceRoutes = require('./routes/attendance.route');
const redistributionRoutes = require('./routes/redistribution.route');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // Allow all during development
  credentials: true
}));

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/redistribution', redistributionRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date(), message: 'AI Health Center Management API running successfully' });
});

// Fallback Route Handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ message: err.message || 'Internal server error occurred' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
