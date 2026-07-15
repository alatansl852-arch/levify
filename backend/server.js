const express = require('express');
const cors = require('cors');
const db = require('./config/database');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads', 'leave-attachments');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

// Test database connection
db.connect()
  .then(client => {
    console.log('✅ PostgreSQL database connected successfully');
    client.release();
  })
  .catch(err => console.error('❌ PostgreSQL connection failed:', err));

const mobileRoutes = require('./routes/MobileRoutes');
   app.use('/api/mobile', mobileRoutes);
   console.log('✅ Mobile routes registered at /api/mobile');

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('🔵 Health check called');
  res.json({ status: 'ok', message: 'Server is running', timestamp: new Date() });
});

// Auth routes
const authRoutes = require('./routes/AuthRoutes');
app.use('/api/auth', authRoutes);
console.log('✅ Auth routes registered at /api/auth');

// Leave routes
const leaveRoutes = require('./routes/LeaveRoutes');
app.use('/api/leave', leaveRoutes);
console.log('✅ Leave routes registered at /api/leave');

// Employee routes
const employeeRoutes = require('./routes/EmployeeRoutes');
app.use('/api/employees', employeeRoutes);
console.log('✅ Employee routes registered at /api/employees');

// Notification routes
const notificationRoutes = require('./routes/NotificationRoutes');
app.use('/api/notifications', notificationRoutes);
console.log('✅ Notification routes registered at /api/notifications');

// Reports routes
const reportsRoutes = require('./routes/ReportsRoutes');
app.use('/api/reports', reportsRoutes);
console.log('✅ Reports routes registered at /api/reports');

// 404 handler
app.use((req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.url);
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ success: false, message: err.message });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log(`🚀 Server STARTED and LISTENING on port ${PORT}`);
  console.log(`📍 Access at: http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📍 Debug endpoint: http://localhost:${PORT}/api/leave/debug/USER_ID`);
  console.log('='.repeat(50));
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.error('💡 Solution: Close other apps using port 5000 or change PORT in .env');
    console.error('💡 Or run: npx kill-port 5000');
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});