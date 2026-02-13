const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { testConnection } = require('./config/database');

// Import route modules
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const customerRoutes = require('./routes/customers');
const promotionRoutes = require('./routes/promotions');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('.'));

// Test database connection on startup
app.get('/api/health', async (req, res) => {
  try {
    const isConnected = await testConnection();
    if (isConnected) {
      res.json({
        status: 'success',
        message: 'Server is running and database is connected',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Server is running but database connection failed',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/promotions', promotionRoutes);

// Default route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  
  // Test database connection
  console.log('\n🔌 Testing database connection...');
  await testConnection();
  
  console.log('\n📋 Available API endpoints:');
  console.log(`   GET  /api/health - Server and database status`);
  console.log(`   GET  /api/menu - Get all menu items`);
  console.log(`   GET  /api/menu/categories - Get all categories`);
  console.log(`   GET  /api/menu/popular - Get popular items`);
  console.log(`   POST /api/orders - Create new order`);
  console.log(`   GET  /api/orders/:id - Get order details`);
  console.log(`   PUT  /api/orders/:id/status - Update order status`);
  console.log(`   GET  /api/customers - Get all customers`);
  console.log(`   POST /api/customers - Create new customer`);
  console.log(`   GET  /api/promotions - Get active promotions`);
});
